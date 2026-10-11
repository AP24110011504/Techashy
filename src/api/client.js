/**
 * AEGISX Sentinel API Client
 * Fetch wrapper with retry, timeout protection,
 * backend availability detection, and mock-mode fallback.
 */

import {
  INITIAL_SOURCES,
  INITIAL_INCIDENT,
  SIMULATED_SOURCES,
  SIMULATED_INCIDENT,
  SIMULATED_EVENTS,
  SIMULATED_EVIDENCE,
  SIMULATED_INVESTIGATION_FINDINGS,
  INITIAL_CONTAINMENT_ACTION,
  EXECUTED_CONTAINMENT_ACTION,
  PRESET_VOICE_RESPONSES,
  INITIAL_AUDIT_LOG,
  MOCK_CONTAINMENT_HOSTS,
  MOCK_INCIDENTS_LIST,
  MOCK_FORENSIC_ARTIFACTS
} from './mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 4000;
const MOCK_FALLBACK_ENABLED =
  import.meta.env.VITE_ENABLE_MOCK_FALLBACK !== 'false';

// In-memory mock state for the dashboard.
class MockBackendState {
  constructor() {
    this.reset();
  }

  reset() {
    this.simulationRun = false;
    this.incident = { ...INITIAL_INCIDENT };
    this.sources = [...INITIAL_SOURCES];
    this.events = [];
    this.evidence = [];
    this.investigationFindings = [];
    this.containmentAction = { ...INITIAL_CONTAINMENT_ACTION };
    this.auditLog = [...INITIAL_AUDIT_LOG];
    this.containmentHosts = [...MOCK_CONTAINMENT_HOSTS];
    this.incidents = [...MOCK_INCIDENTS_LIST];
    this.forensicArtifacts = [...MOCK_FORENSIC_ARTIFACTS];
  }

  triggerSimulation() {
    this.simulationRun = true;
    this.incident = { ...SIMULATED_INCIDENT };
    this.sources = [...SIMULATED_SOURCES];
    this.events = [...SIMULATED_EVENTS];
    this.evidence = [...SIMULATED_EVIDENCE];
    this.investigationFindings = [...SIMULATED_INVESTIGATION_FINDINGS];
    this.containmentAction = { ...INITIAL_CONTAINMENT_ACTION };
    this.incidents = [...MOCK_INCIDENTS_LIST];
  }

  approveAction(decision = 'APPROVED', note = '') {
    if (decision === 'APPROVED') {
      // Record a simulated approval only.
      // Do not claim that real infrastructure was changed.
      this.containmentAction = {
        ...this.containmentAction,
        status: 'APPROVED',
        analystNote: note || 'Approved in simulation.',
        outcome: 'Approval recorded in simulation. No real system changes were made.',
        executedAt: null,
        isMock: true
      };

      this.auditLog = [
        {
          timestamp: new Date().toISOString(),
          operator: 'SOC_ANALYST (SIMULATION)',
          action: 'SIMULATED_CONTAINMENT_APPROVAL',
          target: 'prod-db-replica-02',
          verified: 'SIMULATED — not a real infrastructure change'
        },
        ...this.auditLog
      ];
    } else {
      this.containmentAction = {
        ...this.containmentAction,
        status: 'REJECTED',
        analystNote: note || 'Action rejected by SOC lead.',
        outcome: 'Proposal rejected in simulation. No real system changes were made.',
        isMock: true
      };
    }
  }

  executeEmergencyLockdown() {
    // Simulation only: do not change host isolation states.
    this.auditLog = [
      {
        timestamp: new Date().toISOString(),
        operator: 'SOC_ANALYST (SIMULATION)',
        action: 'SIMULATED_EMERGENCY_LOCKDOWN',
        target: 'ALL_HOSTS_VPC_FABRIC',
        verified: 'SIMULATED — no real infrastructure changes were made'
      },
      ...this.auditLog
    ];
  }
}

export const mockState = new MockBackendState();

// Global connection-state tracker.
export const ConnectionMode = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  MOCK_MODE: 'MOCK_MODE'
};

let currentMode = ConnectionMode.DISCONNECTED;
let listeners = [];

export function subscribeConnectionState(callback) {
  listeners.push(callback);
  callback(currentMode);

  return () => {
    listeners = listeners.filter((listener) => listener !== callback);
  };
}

function notifyModeChange(mode) {
  if (currentMode !== mode) {
    currentMode = mode;
    listeners.forEach((listener) => listener(currentMode));
  }
}

export function forceConnectionMode(mode) {
  notifyModeChange(mode);
}

export function getCurrentConnectionMode() {
  return currentMode;
}

/**
 * Fetch wrapper with timeout and retry protection.
 */
async function requestWithRetry(
  endpoint,
  options = {},
  retries = 1,
  timeoutMs = DEFAULT_TIMEOUT_MS
) {
  if (currentMode === ConnectionMode.MOCK_MODE) {
    throw new Error('MOCK_MODE_ACTIVE');
  }

  const url = `${BASE_URL}${endpoint}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP_${response.status}_${response.statusText}`);
      }

      const data = await response.json();
      notifyModeChange(ConnectionMode.CONNECTED);

      return { data, isMock: false };
    } catch (error) {
      clearTimeout(timer);

      if (attempt === retries) {
        notifyModeChange(ConnectionMode.MOCK_MODE);
        throw error;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 300 * Math.pow(2, attempt))
      );
    }
  }
}

const delay = (ms = 400) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Shared fallback helper.
 */
async function fallback(operation) {
  if (!MOCK_FALLBACK_ENABLED) {
    throw new Error('Backend request failed and mock fallback is disabled.');
  }

  return operation();
}

/**
 * AEGISX Sentinel API methods.
 */
export const api = {
  /**
   * GET /api/status
   */
  async getStatus() {
    try {
      const res = await requestWithRetry('/api/status');
      return { ...res.data, isMock: false };
    } catch {
      return fallback(async () => {
        await delay(250);

        return {
          status: 'healthy',
          version: '1.4.0',
          timestamp: new Date().toISOString(),
          service: 'AEGISX Sentinel Core (Mock Adapter)',
          mode: 'mock',
          connectedSources: 5,
          systemLoad: 0.28,
          activeIncidents: mockState.simulationRun ? 1 : 0,
          isMock: true
        };
      });
    }
  },

  /**
   * POST /api/scenario/run
   */
  async runScenario(
    scenarioId = 'attack-sim-apt29-db-breach',
    intensity = 'high'
  ) {
    try {
      const res = await requestWithRetry('/api/scenario/run', {
        method: 'POST',
        body: JSON.stringify({ scenarioId, intensity })
      });

      return { ...res.data, isMock: false };
    } catch {
      return fallback(async () => {
        await delay(800);
        mockState.triggerSimulation();

        return {
          success: true,
          simulationId: 'SIM-8842-DELTA',
          incidentId: mockState.incident.incidentId,
          incidentName: mockState.incident.incidentName,
          severity: mockState.incident.severity,
          threatScore: mockState.incident.threatScore,
          detectionStatus: mockState.incident.detectionStatus,
          phase: mockState.incident.phase,
          affectedAssets: mockState.incident.affectedAssets,
          message: 'Attack scenario simulated. Mock telemetry was loaded.',
          timestamp: new Date().toISOString(),
          isMock: true
        };
      });
    }
  },

  /**
   * GET /api/events
   */
  async getEvents(incidentId) {
    try {
      const query = incidentId
        ? `?incidentId=${encodeURIComponent(incidentId)}`
        : '';

      const res = await requestWithRetry(`/api/events${query}`);
      return { ...res.data, isMock: false };
    } catch {
      return fallback(async () => {
        await delay(300);

        return {
          incidentId: mockState.incident.incidentId,
          total: mockState.events.length,
          events: mockState.events,
          isMock: true
        };
      });
    }
  },

  /**
   * GET /api/sources
   */
  async getSources() {
    try {
      const res = await requestWithRetry('/api/sources');
      return { ...res.data, isMock: false };
    } catch {
      return fallback(async () => {
        await delay(300);
        return { sources: mockState.sources, isMock: true };
      });
    }
  },

  /**
   * GET /api/evidence
   */
  async getEvidence(incidentId) {
    try {
      const query = incidentId
        ? `?incidentId=${encodeURIComponent(incidentId)}`
        : '';

      const res = await requestWithRetry(`/api/evidence${query}`);
      return { ...res.data, isMock: false };
    } catch {
      return fallback(async () => {
        await delay(350);

        return {
          incidentId: mockState.incident.incidentId,
          chainValid: true,
          immutableAuditHeight: 14092,
          verifiedTimestamp: new Date().toISOString(),
          evidenceRecords: mockState.evidence,
          isMock: true
        };
      });
    }
  },

  /**
   * POST /api/investigate
   *
   * Note: This payload may need adaptation to the backend's
   * InvestigationRequest model, which expects events and evidence.
   */
  async investigate(incidentId = 'INC-2026-9042', scope = 'full') {
    try {
      const res = await requestWithRetry('/api/investigate', {
        method: 'POST',
        body: JSON.stringify({ incident_id: incidentId, context_notes: scope })
      });

      return { ...res.data, isMock: false };
    } catch {
      return fallback(async () => {
        await delay(600);

        return {
          incidentId: mockState.incident.incidentId,
          analyzedAt: new Date().toISOString(),
          consensusConfidence: mockState.simulationRun ? 0.93 : 0.0,
          findings: mockState.investigationFindings,
          isMock: true
        };
      });
    }
  },

  /**
   * POST /api/voice/query
   */
  async queryVoice(query, contextIncidentId) {
    try {
      const res = await requestWithRetry('/api/voice/query', {
        method: 'POST',
        body: JSON.stringify({ query, contextIncidentId })
      });

      return { ...res.data, isMock: false };
    } catch {
      return fallback(async () => {
        await delay(500);

        const preset = PRESET_VOICE_RESPONSES[query] || {
          answer: `AEGISX Sentinel simulated the query "${query}". Mock telemetry reports threat score ${mockState.incident.threatScore}/100 across ${mockState.incident.affectedAssets.length} affected assets.`,
          confidence: 0.91,
          suggestedActions: [
            'Inspect Compromised Sources',
            'Review Evidence Hashes',
            'Verify Merkle Proofs'
          ]
        };

        return {
          query,
          answer: preset.answer,
          confidence: preset.confidence,
          suggestedActions: preset.suggestedActions,
          timestamp: new Date().toISOString(),
          isMock: true
        };
      });
    }
  },

  /**
   * POST /api/actions/approve
   *
   * Backend request fields:
   * incident_id, action, target, approved_by, justification.
   */
  async approveAction(
    actionId,
    decision = 'APPROVED',
    analystNote = '',
    approvedBy = ''
  ) {
    if (decision !== 'APPROVED') {
      return fallback(async () => {
        await delay(250);
        mockState.approveAction('REJECTED', analystNote);

        return {
          actionId,
          status: 'REJECTED',
          outcome: 'Proposal rejected in simulation. No real system changes were made.',
          isMock: true
        };
      });
    }

    try {
      const res = await requestWithRetry('/api/actions/approve', {
        method: 'POST',
        body: JSON.stringify({
          incident_id: mockState.incident.incidentId || 'INC-2026-9042',
          action: 'isolate_endpoint',
          target: 'prod-db-replica-02',
          approved_by: approvedBy.trim() || 'SOC analyst',
          justification: analystNote || 'Approved containment action'
        })
      });

      return { ...res.data, isMock: false };
    } catch {
      return fallback(async () => {
        await delay(250);

        mockState.approveAction('APPROVED', analystNote);

        return {
          actionId,
          status: 'APPROVED',
          outcome: 'Approval recorded in simulation. No real system changes were made.',
          analystNote,
          isMock: true
        };
      });
    }
  },

  /**
   * GET /api/audit
   */
  async getAuditLog() {
    try {
      const res = await requestWithRetry('/api/audit');
      return { records: res.data.records || res.data, isMock: false };
    } catch {
      return fallback(async () => {
        await delay(300);
        return { records: mockState.auditLog, isMock: true };
      });
    }
  },

  /**
   * GET /api/containment/hosts
   */
  async getContainmentHosts() {
    try {
      const res = await requestWithRetry('/api/containment/hosts');
      return { hosts: res.data.hosts || res.data, isMock: false };
    } catch {
      return fallback(async () => {
        await delay(250);
        return { hosts: mockState.containmentHosts, isMock: true };
      });
    }
  },

  /**
   * GET /api/incidents
   */
  async getIncidents() {
    try {
      const res = await requestWithRetry('/api/incidents');
      return { incidents: res.data.incidents || res.data, isMock: false };
    } catch {
      return fallback(async () => {
        await delay(250);
        return { incidents: mockState.incidents, isMock: true };
      });
    }
  },

  /**
   * GET /api/forensics/artifacts
   */
  async getForensicArtifacts() {
    try {
      const res = await requestWithRetry('/api/forensics/artifacts');
      return { artifacts: res.data.artifacts || res.data, isMock: false };
    } catch {
      return fallback(async () => {
        await delay(300);
        return { artifacts: mockState.forensicArtifacts, isMock: true };
      });
    }
  },

  /**
   * POST /api/containment/lockdown
   * This fallback records a simulation; it does not isolate hosts.
   */
  async executeEmergencyLockdown(reason = 'Global autonomous threat containment') {
    try {
      const res = await requestWithRetry('/api/containment/lockdown', {
        method: 'POST',
        body: JSON.stringify({ reason })
      });

      return { ...res.data, isMock: false };
    } catch {
      return fallback(async () => {
        await delay(300);
        mockState.executeEmergencyLockdown();

        return {
          success: true,
          status: 'SIMULATED',
          affectedHosts: mockState.containmentHosts.length,
          timestamp: new Date().toISOString(),
          outcome: 'Emergency lockdown recorded in simulation. No real system changes were made.',
          isMock: true
        };
      });
    }
  },

  /**
   * Reset the simulation.
   */
  resetSimulation() {
    mockState.reset();
  }
};
