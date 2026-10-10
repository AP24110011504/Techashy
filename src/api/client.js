/**
 * AEGISX Sentinel API Client
 * Enterprise-grade fetch wrapper with retry, timeout protection,
 * backend availability detection, and seamless mock mode adapter.
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

// In-memory mock state machine to reflect state transitions dynamically
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
      this.containmentAction = {
        ...EXECUTED_CONTAINMENT_ACTION,
        analystNote: note || EXECUTED_CONTAINMENT_ACTION.analystNote,
        executedAt: new Date().toISOString()
      };
      this.incident = {
        ...this.incident,
        phase: 'CONTAINED',
        threatScore: 24,
        detectionStatus: 'CONTAINED_MITIGATED'
      };
      // Mark prod-db-replica-02 as ISOLATED
      this.containmentHosts = this.containmentHosts.map(h =>
        h.hostname === 'prod-db-replica-02' ? { ...h, isolationStatus: 'ISOLATED' } : h
      );
      // Prepend audit record
      this.auditLog = [
        {
          blockHeight: this.auditLog.length > 0 ? this.auditLog[0].blockHeight + 1 : 14093,
          timestamp: new Date().toISOString(),
          operator: 'LEAD_SOC_ANALYST (HUMAN_AUTH)',
          action: 'ENFORCE_CONTAINMENT_ACT_ISO_PROD_DB',
          target: 'prod-db-replica-02 [10.0.4.18]',
          signatureHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
          verified: 'VALID (ECDSA-P256)',
          merkleRoot: '0x49f1a0b41'
        },
        ...this.auditLog
      ];
    } else {
      this.containmentAction = {
        ...this.containmentAction,
        status: 'REJECTED',
        analystNote: note || 'Action rejected by SOC lead.'
      };
    }
  }

  executeEmergencyLockdown() {
    this.containmentHosts = this.containmentHosts.map(h => ({
      ...h,
      isolationStatus: 'ISOLATED'
    }));
    this.auditLog = [
      {
        blockHeight: this.auditLog.length > 0 ? this.auditLog[0].blockHeight + 1 : 14094,
        timestamp: new Date().toISOString(),
        operator: 'LEAD_SOC_ANALYST (EMERGENCY_LOCKDOWN)',
        action: 'GLOBAL_NETWORK_SEVER_ALL_NODES',
        target: 'ALL_HOSTS_VPC_FABRIC',
        signatureHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        verified: 'VALID (HSM_EMERGENCY_KEY)',
        merkleRoot: '0x49f1a0b42'
      },
      ...this.auditLog
    ];
  }
}

export const mockState = new MockBackendState();

// Global connection state tracker
export const ConnectionMode = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  MOCK_MODE: 'MOCK_MODE'
};

// Store current operational mode
let currentMode = ConnectionMode.MOCK_MODE;
let listeners = [];

export function subscribeConnectionState(callback) {
  listeners.push(callback);
  callback(currentMode);
  return () => {
    listeners = listeners.filter(cb => cb !== callback);
  };
}

function notifyModeChange(mode) {
  if (currentMode !== mode) {
    currentMode = mode;
    listeners.forEach(cb => cb(currentMode));
  }
}

export function forceConnectionMode(mode) {
  notifyModeChange(mode);
}

export function getCurrentConnectionMode() {
  return currentMode;
}

/**
 * Robust fetch wrapper with timeout and retry protection
 */
async function requestWithRetry(endpoint, options = {}, retries = 1, timeoutMs = DEFAULT_TIMEOUT_MS) {
  // If user explicitly forced MOCK_MODE, bypass network
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
    } catch (err) {
      clearTimeout(timer);
      if (attempt === retries) {
        // Mark as disconnected or fallback to mock
        notifyModeChange(ConnectionMode.MOCK_MODE);
        throw err;
      }
      // Wait with exponential backoff before retry
      await new Promise(res => setTimeout(res, 300 * Math.pow(2, attempt)));
    }
  }
}

// Simulated network delay for realistic mock responses
const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));

/**
 * AEGISX Sentinel API Methods
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
    }
  },

  /**
   * POST /api/scenario/run
   */
  async runScenario(scenarioId = 'attack-sim-apt29-db-breach', intensity = 'high') {
    try {
      const res = await requestWithRetry('/api/scenario/run', {
        method: 'POST',
        body: JSON.stringify({ scenarioId, intensity })
      });
      return { ...res.data, isMock: false };
    } catch {
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
        message: 'Attack scenario successfully executed. 6 telemetry events recorded, 3 agent investigations completed.',
        timestamp: new Date().toISOString(),
        isMock: true
      };
    }
  },

  /**
   * GET /api/events
   */
  async getEvents(incidentId) {
    try {
      const query = incidentId ? `?incidentId=${encodeURIComponent(incidentId)}` : '';
      const res = await requestWithRetry(`/api/events${query}`);
      return { ...res.data, isMock: false };
    } catch {
      await delay(300);
      return {
        incidentId: mockState.incident.incidentId,
        total: mockState.events.length,
        events: mockState.events,
        isMock: true
      };
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
      await delay(300);
      return {
        sources: mockState.sources,
        isMock: true
      };
    }
  },

  /**
   * GET /api/evidence
   */
  async getEvidence(incidentId) {
    try {
      const query = incidentId ? `?incidentId=${encodeURIComponent(incidentId)}` : '';
      const res = await requestWithRetry(`/api/evidence${query}`);
      return { ...res.data, isMock: false };
    } catch {
      await delay(350);
      return {
        incidentId: mockState.incident.incidentId,
        chainValid: true,
        immutableAuditHeight: 14092,
        verifiedTimestamp: new Date().toISOString(),
        evidenceRecords: mockState.evidence,
        isMock: true
      };
    }
  },

  /**
   * POST /api/investigate
   */
  async investigate(incidentId = 'INC-2026-9042', scope = 'full') {
    try {
      const res = await requestWithRetry('/api/investigate', {
        method: 'POST',
        body: JSON.stringify({ incidentId, scope })
      });
      return { ...res.data, isMock: false };
    } catch {
      await delay(600);
      return {
        incidentId: mockState.incident.incidentId,
        analyzedAt: new Date().toISOString(),
        consensusConfidence: mockState.simulationRun ? 0.93 : 0.0,
        findings: mockState.investigationFindings,
        isMock: true
      };
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
      await delay(500);
      // Smart matching against presets or fallback
      const preset = PRESET_VOICE_RESPONSES[query] || {
        answer: `AEGISX Sentinel analyzed query "${query}". Active telemetry indicates threat score ${mockState.incident.threatScore}/100 across ${mockState.incident.affectedAssets.length} affected assets. Identity and EDR sensors are continuously feeding cryptographically-verified telemetry into the investigation buffer.`,
        confidence: 0.91,
        suggestedActions: ["Inspect Compromised Sources", "Review Evidence Hashes", "Verify Merkle Proofs"]
      };

      return {
        query,
        answer: preset.answer,
        confidence: preset.confidence,
        suggestedActions: preset.suggestedActions,
        timestamp: new Date().toISOString(),
        isMock: true
      };
    }
  },

  /**
   * POST /api/actions/approve
   */
  async approveAction(actionId, decision = 'APPROVED', analystNote = '') {
    try {
      const res = await requestWithRetry('/api/actions/approve', {
        method: 'POST',
        body: JSON.stringify({ actionId, decision, analystNote })
      });
      return { ...res.data, isMock: false };
    } catch {
      await delay(650);
      mockState.approveAction(decision, analystNote);
      return {
        success: true,
        actionId: mockState.containmentAction.actionId,
        actionName: mockState.containmentAction.actionName,
        status: mockState.containmentAction.status,
        riskReduction: mockState.containmentAction.riskReduction,
        potentialImpact: mockState.containmentAction.potentialImpact,
        executedAt: mockState.containmentAction.executedAt || new Date().toISOString(),
        outcome: mockState.containmentAction.outcome || 'Action recorded.',
        isMock: true
      };
    }
  },

  /**
   * GET /api/audit (or fallback to cryptographically verified audit records)
   */
  async getAuditLog() {
    try {
      const res = await requestWithRetry('/api/audit');
      return { records: res.data.records || res.data, isMock: false };
    } catch {
      await delay(300);
      return {
        records: mockState.auditLog,
        isMock: true
      };
    }
  },

  /**
   * GET /api/containment/hosts (or fallback)
   */
  async getContainmentHosts() {
    try {
      const res = await requestWithRetry('/api/containment/hosts');
      return { hosts: res.data.hosts || res.data, isMock: false };
    } catch {
      await delay(250);
      return {
        hosts: mockState.containmentHosts,
        isMock: true
      };
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
      await delay(250);
      return {
        incidents: mockState.incidents,
        isMock: true
      };
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
      await delay(300);
      return {
        artifacts: mockState.forensicArtifacts,
        isMock: true
      };
    }
  },

  /**
   * POST /api/containment/lockdown
   */
  async executeEmergencyLockdown(reason = 'Global autonomous threat containment') {
    try {
      const res = await requestWithRetry('/api/containment/lockdown', {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      return { ...res.data, isMock: false };
    } catch {
      await delay(700);
      mockState.executeEmergencyLockdown();
      return {
        success: true,
        status: 'EXECUTED',
        affectedHosts: mockState.containmentHosts.length,
        timestamp: new Date().toISOString(),
        outcome: 'Global microsegmentation rules enforced. All non-essential VPC interfaces severed.',
        isMock: true
      };
    }
  },

  /**
   * Reset the simulation back to baseline (helper for demo restarts)
   */
  resetSimulation() {
    mockState.reset();
  }
};
