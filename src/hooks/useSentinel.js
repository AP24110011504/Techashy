import { useState, useEffect, useCallback } from 'react';
import { api, subscribeConnectionState, ConnectionMode, forceConnectionMode } from '../api/client';

const INITIAL_VOICE_HISTORY = [
  {
    query: "What is the blast radius and which servers are affected?",
    answer: "The blast radius is currently constrained to the US-East VPC: prod-db-replica-02 and auth-srv-us-east-1. The primary database cluster remains unbreached, but egress exfiltration is actively attempting cross-VPC traversal via IAM service credentials. Recommended containment will prevent lateral spread with zero expected customer downtime.",
    confidence: 0.96,
    suggestedActions: ["Quarantine Replica Node", "Revoke IAM Credentials", "Freeze Replication Pipeline"],
    timestamp: "2026-10-10T10:59:45Z"
  }
];

export function useSentinel() {
  const [status, setStatus] = useState(null);
  const [sources, setSources] = useState([]);
  const [incident, setIncident] = useState(null);
  const [events, setEvents] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [chainValid, setChainValid] = useState(true);
  const [investigations, setInvestigations] = useState([]);
  const [containmentAction, setContainmentAction] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [containmentHosts, setContainmentHosts] = useState([]);
  const [incidentsList, setIncidentsList] = useState([]);
  const [forensicArtifacts, setForensicArtifacts] = useState([]);
  const [voiceHistory, setVoiceHistory] = useState(INITIAL_VOICE_HISTORY);

  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isLockingDown, setIsLockingDown] = useState(false);
  const [isQueryingVoice, setIsQueryingVoice] = useState(false);
  const [connectionMode, setConnectionMode] = useState(ConnectionMode.DISCONNECTED);
  const [isMockData, setIsMockData] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe to connection mode changes
  useEffect(() => {
    const unsubscribe = subscribeConnectionState(mode => {
      setConnectionMode(mode);
      setIsMockData(mode !== ConnectionMode.CONNECTED);
    });
    return unsubscribe;
  }, []);

  // Fetch all dashboard data
  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const [
        statusRes,
        sourcesRes,
        eventsRes,
        evidenceRes,
        investRes,
        auditRes,
        hostsRes,
        incidentsRes,
        artifactsRes
      ] = await Promise.all([
        api.getStatus(),
        api.getSources(),
        api.getEvents(),
        api.getEvidence(),
        api.investigate(),
        api.getAuditLog(),
        api.getContainmentHosts(),
        api.getIncidents(),
        api.getForensicArtifacts()
      ]);

      setStatus(statusRes);
      setSources(sourcesRes.sources || []);
      setEvents(eventsRes.events || []);
      setEvidence(evidenceRes.evidenceRecords || []);
      setChainValid(evidenceRes.chainValid !== false);
      setInvestigations(investRes.findings || []);
      setAuditLog(auditRes.records || []);
      setContainmentHosts(hostsRes.hosts || []);
      setIncidentsList(incidentsRes.incidents || []);
      setForensicArtifacts(artifactsRes.artifacts || []);

      // If simulated events exist, synthesize incident details
      if (eventsRes.events && eventsRes.events.length > 0) {
        setIncident({
          incidentId: eventsRes.incidentId || 'INC-2026-9042',
          incidentName: 'APT-29 Identity Compromise & Bulk DB Exfiltration',
          severity: 'CRITICAL',
          detectionStatus: 'ACTIVE_INVESTIGATION',
          threatScore: 87,
          affectedAssets: ['auth-srv-us-east-1', 'prod-db-replica-02', 'iam-admin-vault'],
          phase: 'CONTAINMENT_PENDING'
        });
      } else {
        setIncident({
          incidentId: 'INC-2026-9040',
          incidentName: 'Baseline SOC Monitoring — No Active Threat',
          severity: 'LOW',
          detectionStatus: 'IDLE_MONITORING',
          threatScore: 12,
          affectedAssets: ['All hosts nominal (0 infected)'],
          phase: 'NOMINAL'
        });
      }

      setContainmentAction({
        actionId: 'ACT-ISO-PROD-DB',
        actionName: 'Isolate Database Read Replica and Revoke IAM Session',
        status: 'PENDING',
        riskReduction: '85%',
        potentialImpact: 'Read traffic automatically reroutes to backup cluster. Expected read query latency increase < 45ms.',
        analystNote: 'Awaiting human authorization before enforcing network isolation.'
      });

      setIsMockData(Boolean(statusRes.isMock || sourcesRes.isMock));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Telemetry feed degraded or backend unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Run attack simulation
  const runSimulation = async () => {
    setIsSimulating(true);
    setSimulationResult(null);
    try {
      const res = await api.runScenario('attack-sim-apt29-db-breach', 'high');
      setSimulationResult(res);
      // Immediately reload telemetry
      await fetchData();
    } catch (err) {
      console.error('Simulation error:', err);
      setError('Simulation failed to trigger.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Human approval of containment
  const approveAction = async (decision = 'APPROVED', note = '') => {
    setIsApproving(true);
    try {
      const res = await api.approveAction('ACT-ISO-PROD-DB', decision, note);
      setContainmentAction(res);
      // Reload audit & hosts
      const [auditRes, hostsRes] = await Promise.all([
        api.getAuditLog(),
        api.getContainmentHosts()
      ]);
      setAuditLog(auditRes.records || []);
      setContainmentHosts(hostsRes.hosts || []);

      if (decision === 'APPROVED') {
        setIncident(prev => prev ? {
          ...prev,
          phase: 'CONTAINED',
          threatScore: 24,
          detectionStatus: 'CONTAINED_MITIGATED'
        } : null);
      }
    } catch (err) {
      console.error('Action approval error:', err);
      setError('Failed to record containment decision.');
    } finally {
      setIsApproving(false);
    }
  };

  // Emergency lockdown trigger
  const triggerEmergencyLockdown = async (reason = 'Global emergency quarantine') => {
    setIsLockingDown(true);
    try {
      const res = await api.executeEmergencyLockdown(reason);
      const [auditRes, hostsRes] = await Promise.all([
        api.getAuditLog(),
        api.getContainmentHosts()
      ]);
      setAuditLog(auditRes.records || []);
      setContainmentHosts(hostsRes.hosts || []);
      return res;
    } catch (err) {
      console.error('Lockdown error:', err);
      setError('Failed to enforce emergency lockdown.');
    } finally {
      setIsLockingDown(false);
    }
  };

  // Natural language query ("Ask AEGISX")
  const askAegis = async (queryText) => {
    if (!queryText.trim()) return;
    setIsQueryingVoice(true);
    try {
      const res = await api.queryVoice(queryText, incident?.incidentId);
      setVoiceHistory(prev => [res, ...prev]);
      return res;
    } catch (err) {
      console.error('Query error:', err);
      setError('Investigation query failed.');
    } finally {
      setIsQueryingVoice(false);
    }
  };

  // Reset to initial baseline
  const resetSimulation = async () => {
    api.resetSimulation();
    setSimulationResult(null);
    await fetchData();
  };

  // Toggle mock mode manually
  const toggleMockMode = () => {
    if (connectionMode === ConnectionMode.MOCK_MODE) {
      forceConnectionMode(ConnectionMode.CONNECTED);
    } else {
      forceConnectionMode(ConnectionMode.MOCK_MODE);
    }
    fetchData();
  };

  return {
    status,
    sources,
    incident,
    events,
    evidence,
    chainValid,
    investigations,
    containmentAction,
    auditLog,
    containmentHosts,
    incidentsList,
    forensicArtifacts,
    voiceHistory,
    loading,
    isSimulating,
    simulationResult,
    isApproving,
    isLockingDown,
    isQueryingVoice,
    connectionMode,
    isMockData,
    error,
    refreshAll: fetchData,
    runSimulation,
    approveAction,
    triggerEmergencyLockdown,
    askAegis,
    resetSimulation,
    toggleMockMode
  };
}
