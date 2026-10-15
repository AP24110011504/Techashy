
import { useState, useEffect, useCallback } from 'react';
import { api, subscribeConnectionState, ConnectionMode } from '../api/client';

const INCIDENT_ID = 'INC-BRUTEFORCE-DEMO';

export function useSentinel() {
  const [status, setStatus] = useState(null);
  const [sources, setSources] = useState([]);
  const [incident, setIncident] = useState(null);
  const [events, setEvents] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [chainValid, setChainValid] = useState(null);
  const [investigations, setInvestigations] = useState([]);
  const [containmentAction, setContainmentAction] = useState(null);
  const [auditLog] = useState([]);
  const [containmentHosts] = useState([]);
  const [incidentsList] = useState([]);
  const [forensicArtifacts] = useState([]);
  const [voiceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSimulating] = useState(false);
  const [simulationResult] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isLockingDown] = useState(false);
  const [isQueryingVoice] = useState(false);
  const [connectionMode, setConnectionMode] = useState(ConnectionMode.DISCONNECTED);
  const [error, setError] = useState(null);

  useEffect(() => subscribeConnectionState(setConnectionMode), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusRes = await api.getStatus();
      setStatus(statusRes);

      const [eventsRes, sourcesRes, evidenceRes] = await Promise.all([
        api.getEvents(INCIDENT_ID),
        api.getSources(INCIDENT_ID),
        api.getEvidence(INCIDENT_ID),
      ]);

      const actualEvents = eventsRes.events || eventsRes.timeline || [];
      setEvents(actualEvents);
      setSources(sourcesRes.sources || []);
      setEvidence(evidenceRes.evidenceRecords || evidenceRes.evidence || []);
      setChainValid(
        typeof evidenceRes.chainValid === 'boolean'
          ? evidenceRes.chainValid
          : null
      );

      setIncident(actualEvents.length ? {
        incidentId: eventsRes.incidentId || INCIDENT_ID,
        events: actualEvents,
        severity: actualEvents.some(e => String(e.severity).toUpperCase() === 'CRITICAL')
          ? 'CRITICAL'
          : actualEvents.some(e => String(e.severity).toUpperCase() === 'HIGH')
            ? 'HIGH'
            : 'UNKNOWN',
        detectionStatus: 'OBSERVED',
      } : null);

      if (actualEvents.length) {
        const report = await api.investigate(INCIDENT_ID);
        setInvestigations(report.findings || []);
      } else {
        setInvestigations([]);
      }
    } catch (err) {
      setError(err.message || 'Unable to load live backend data.');
      setIncident(null);
      setInvestigations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const runSimulation = async () => {
    setError('Scenario simulation is unavailable: the backend has no simulation endpoint.');
  };

  const approveAction = async (decision = 'APPROVED', note = '') => {
    if (decision !== 'APPROVED') {
      setError('The backend approval API currently records approved actions only.');
      return;
    }
    setError('Approval needs an explicit action, target, approver identity, and justification. No action was sent.');
  };

  const triggerEmergencyLockdown = async () => {
    setError('Emergency lockdown endpoint is not implemented. No system was isolated.');
  };

  const askAegis = async () => {
    setError('Voice query endpoint is not implemented by the backend.');
  };

  const resetSimulation = async () => {
    await fetchData();
  };

  const toggleMockMode = () => {
    setError('Mock mode has been removed. The dashboard uses the real backend only.');
  };

  return {
    status, sources, incident, events, evidence, chainValid, investigations,
    containmentAction, auditLog, containmentHosts, incidentsList, forensicArtifacts,
    voiceHistory, loading, isSimulating, simulationResult, isApproving,
    isLockingDown, isQueryingVoice, connectionMode,
    isMockData: false, error, refreshAll: fetchData, runSimulation,
    approveAction, triggerEmergencyLockdown, askAegis, resetSimulation, toggleMockMode,
  };
}
