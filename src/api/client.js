const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const INCIDENT_ID = 'INC-BRUTEFORCE-DEMO';
export const ConnectionMode = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  MOCK_MODE: 'MOCK_MODE',
};
let currentMode = ConnectionMode.DISCONNECTED;
const listeners = new Set();
function setMode(mode) {
  currentMode = mode;
  listeners.forEach(listener => listener(mode));
}
export function subscribeConnectionState(listener) {
  listeners.add(listener);
  listener(currentMode);
  return () => listeners.delete(listener);
}
// Compatibility only: this client never generates mock responses.
export function forceConnectionMode(mode) {
  if (mode === ConnectionMode.MOCK_MODE) {
    setMode(ConnectionMode.DISCONNECTED);
  }
}
async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    setMode(ConnectionMode.DISCONNECTED);
    throw new Error('Backend unreachable. Check that FastAPI is running.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `API request failed (${response.status}): ${path}`);
  }
  setMode(ConnectionMode.CONNECTED);
  return response.json();
}
export const api = {
  async getStatus() {
    const result = await request('/');
    return { ...result, connected: true, isMock: false };
  },
  async getEvents(incidentId = INCIDENT_ID) {
    return request(`/api/events/${encodeURIComponent(incidentId)}`);
  },
  async getSources(incidentId = INCIDENT_ID) {
    return request(`/api/sources/${encodeURIComponent(incidentId)}`);
  },
  async getEvidence(incidentId = INCIDENT_ID) {
    return request(`/api/evidence/${encodeURIComponent(incidentId)}`);
  },
  async investigate(incidentId = INCIDENT_ID) {
    const data = await request(`/api/events/${encodeURIComponent(incidentId)}`);
    const events = data.events || data.timeline || [];
    if (!events.length) {
      throw new Error(`No real events found for ${incidentId}. Run an investigation with actual events first.`);
    }
    return request('/api/investigate', {
      method: 'POST',
      body: JSON.stringify({
        incident_id: incidentId,
        events,
        evidence: [],
        requester: 'AEGISX Dashboard',
      }),
    });
  },
  async approveAction(incidentId, action = 'block_ip', target = null, approvedBy = '', justification = '') {
    if (!approvedBy.trim() || !justification.trim()) {
      throw new Error('Human approver and justification are required.');
    }
    return request('/api/actions/approve', {
      method: 'POST',
      body: JSON.stringify({
        incident_id: incidentId,
        action,
        target,
        approved_by: approvedBy,
        justification,
      }),
    });
  },
  async runScenario() {
    throw new Error('Scenario simulation endpoint is not implemented by the backend.');
  },
  async queryVoice() {
    throw new Error('Voice query endpoint is not implemented by the backend.');
  },
  async getAuditLog() {
    throw new Error('Audit log endpoint is not implemented by the backend.');
  },
  async getContainmentHosts() {
    throw new Error('Containment hosts endpoint is not implemented by the backend.');
  },
  async getIncidents() {
    throw new Error('Incidents list endpoint is not implemented by the backend.');
  },
  async getForensicArtifacts() {
    throw new Error('Forensic artifacts endpoint is not implemented by the backend.');
  },
  async executeEmergencyLockdown() {
    throw new Error('Emergency lockdown endpoint is not implemented by the backend.');
  },
  resetSimulation() {
    // No simulation state exists in the real API client.
  },
};
