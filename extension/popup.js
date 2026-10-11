// AEGISX Sentinel SOC Dashboard Controller
const DEFAULT_API_BASE = "http://127.0.0.1:8000";
let apiBaseUrl = DEFAULT_API_BASE;
let refreshTimer = null;
let isConnected = false;

// DOM Elements Cache
const elements = {
  connectionStatus: document.getElementById("connectionStatus"),
  connectionText: document.getElementById("connectionText"),
  offlineBanner: document.getElementById("offlineBanner"),
  apiBaseLabel: document.getElementById("apiBaseLabel"),
  btnRetryConn: document.getElementById("btnRetryConn"),
  btnRefresh: document.getElementById("btnRefresh"),
  pendingBadge: document.getElementById("pendingBadge"),

  // Metrics
  metricTotalEvents: document.getElementById("metricTotalEvents"),
  metricHighCrit: document.getElementById("metricHighCrit"),
  metricEvidenceStatus: document.getElementById("metricEvidenceStatus"),
  metricSourcesCount: document.getElementById("metricSourcesCount"),
  metricPendingActions: document.getElementById("metricPendingActions"),
  severityCountsText: document.getElementById("severityCountsText"),

  // Severity Bar
  sevBarCrit: document.getElementById("sevBarCrit"),
  sevBarHigh: document.getElementById("sevBarHigh"),
  sevBarMed: document.getElementById("sevBarMed"),
  sevBarLow: document.getElementById("sevBarLow"),
  sevBarInfo: document.getElementById("sevBarInfo"),

  // Tables
  sourcesTableBody: document.getElementById("sourcesTableBody"),
  sourcesSummary: document.getElementById("sourcesSummary"),
  eventsTableBody: document.getElementById("eventsTableBody"),
  eventSeverityFilter: document.getElementById("eventSeverityFilter"),

  // Investigation
  invQueryInput: document.getElementById("invQueryInput"),
  invFocusSelect: document.getElementById("invFocusSelect"),
  btnRunInvestigation: document.getElementById("btnRunInvestigation"),
  invBtnText: document.getElementById("invBtnText"),
  invSpinner: document.getElementById("invSpinner"),
  investigationResults: document.getElementById("investigationResults"),
  invSummaryText: document.getElementById("invSummaryText"),
  invConfidenceBadge: document.getElementById("invConfidenceBadge"),
  invEvidenceBadge: document.getElementById("invEvidenceBadge"),
  invIdBadge: document.getElementById("invIdBadge"),
  invMitreTags: document.getElementById("invMitreTags"),
  triageVerdict: document.getElementById("triageVerdict"),
  triageScore: document.getElementById("triageScore"),
  evidenceVerdict: document.getElementById("evidenceVerdict"),
  evidenceScore: document.getElementById("evidenceScore"),
  hunterVerdict: document.getElementById("hunterVerdict"),
  hunterScore: document.getElementById("hunterScore"),
  timelineList: document.getElementById("timelineList"),
  timelineCount: document.getElementById("timelineCount"),

  // Simulation
  simHostInput: document.getElementById("simHostInput"),
  simAccountInput: document.getElementById("simAccountInput"),
  simScenarioSelect: document.getElementById("simScenarioSelect"),
  btnRunScenario: document.getElementById("btnRunScenario"),
  simBtnText: document.getElementById("simBtnText"),
  simSpinner: document.getElementById("simSpinner"),
  simResultsContainer: document.getElementById("simResultsContainer"),
  simEventsCount: document.getElementById("simEventsCount"),
  simFindingsCount: document.getElementById("simFindingsCount"),
  simTamperAlert: document.getElementById("simTamperAlert"),
  simActionsCount: document.getElementById("simActionsCount"),
  simFindingsList: document.getElementById("simFindingsList"),

  // Evidence
  evidenceIntegrityBanner: document.getElementById("evidenceIntegrityBanner"),
  evidenceBannerIcon: document.getElementById("evidenceBannerIcon"),
  evidenceBannerTitle: document.getElementById("evidenceBannerTitle"),
  evidenceBannerSubtitle: document.getElementById("evidenceBannerSubtitle"),
  tamperViolationsAlert: document.getElementById("tamperViolationsAlert"),
  tamperViolationsList: document.getElementById("tamperViolationsList"),
  evidenceBlocksTotal: document.getElementById("evidenceBlocksTotal"),
  evidenceTableBody: document.getElementById("evidenceTableBody"),

  // Approvals
  approvalsPendingCount: document.getElementById("approvalsPendingCount"),
  pendingActionsList: document.getElementById("pendingActionsList"),
  actionsHistoryTableBody: document.getElementById("actionsHistoryTableBody"),
  actionsHistoryCount: document.getElementById("actionsHistoryCount"),

  // Voice SOC
  voiceQueryInput: document.getElementById("voiceQueryInput"),
  btnVoiceSubmit: document.getElementById("btnVoiceSubmit"),
  voiceBtnText: document.getElementById("voiceBtnText"),
  voiceSpinner: document.getElementById("voiceSpinner"),
  voiceResponseCard: document.getElementById("voiceResponseCard"),
  voiceSpeechText: document.getElementById("voiceSpeechText"),
  voiceIntentTag: document.getElementById("voiceIntentTag"),
  voiceQueryEcho: document.getElementById("voiceQueryEcho"),
  voicePayloadJson: document.getElementById("voicePayloadJson"),
  btnPlayTTS: document.getElementById("btnPlayTTS"),
};

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  setupTabs();
  setupEventListeners();

  if (window.chrome && chrome.storage && chrome.storage.local) {
    const stored = await chrome.storage.local.get(["apiBaseUrl"]);
    if (stored.apiBaseUrl) {
      apiBaseUrl = stored.apiBaseUrl;
    }
  }

  elements.apiBaseLabel.textContent = apiBaseUrl;
  await refreshAll();

  // Gentle auto-refresh every 15 seconds
  refreshTimer = setInterval(() => {
    if (isConnected) {
      refreshAll(false);
    }
  }, 15000);
});

// Tab Navigation
function setupTabs() {
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const targetId = tab.getAttribute("data-tab");
      document.querySelectorAll(".tab-panel").forEach((panel) => {
        panel.classList.remove("active");
      });

      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add("active");
      }

      // Contextual refresh on tab switch
      if (targetId === "tab-evidence") fetchEvidence();
      if (targetId === "tab-approvals") fetchActions();
      if (targetId === "tab-dashboard") refreshAll(false);
    });
  });
}

function setupEventListeners() {
  elements.btnRefresh.addEventListener("click", () => refreshAll(true));
  elements.btnRetryConn.addEventListener("click", () => refreshAll(true));

  elements.eventSeverityFilter.addEventListener("change", (e) => {
    fetchEvents(e.target.value);
  });

  elements.btnRunInvestigation.addEventListener("click", runInvestigation);
  elements.btnRunScenario.addEventListener("click", runSimulation);
  elements.btnVoiceSubmit.addEventListener("click", runVoiceQuery);

  // Quick query suggestion pills
  document.querySelectorAll(".query-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      const q = pill.getAttribute("data-query");
      elements.voiceQueryInput.value = q;
      runVoiceQuery();
    });
  });

  // Text-To-Speech Playback
  elements.btnPlayTTS.addEventListener("click", () => {
    const text = elements.voiceSpeechText.textContent;
    if (text && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  });
}

// Global Refresh
async function refreshAll(showLoading = false) {
  if (showLoading) {
    elements.connectionText.textContent = "CHECKING...";
  }

  const ok = await fetchStatus();
  if (ok) {
    await Promise.all([
      fetchSources(),
      fetchEvents(elements.eventSeverityFilter.value),
      fetchEvidence(),
      fetchActions(),
    ]);
  }
}

// Fetch Status (/api/status)
async function fetchStatus() {
  try {
    const resp = await fetch(`${apiBaseUrl}/api/status`, { cache: "no-store" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    isConnected = true;
    elements.connectionStatus.className = "status-pill status-online";
    elements.connectionText.textContent = "ONLINE";
    elements.offlineBanner.classList.add("hidden");

    // Metrics
    const metrics = data.metrics || {};
    elements.metricTotalEvents.textContent = metrics.total_events || 0;
    elements.metricSourcesCount.textContent = metrics.registered_sources || 0;
    elements.metricPendingActions.textContent = metrics.pending_approval_actions || 0;

    // Update pending badge
    updatePendingBadge(metrics.pending_approval_actions || 0);

    return true;
  } catch (err) {
    isConnected = false;
    elements.connectionStatus.className = "status-pill status-offline";
    elements.connectionText.textContent = "OFFLINE";
    elements.offlineBanner.classList.remove("hidden");
    elements.metricTotalEvents.textContent = "--";
    elements.metricHighCrit.textContent = "--";
    elements.metricEvidenceStatus.textContent = "--";
    elements.metricSourcesCount.textContent = "--";
    elements.metricPendingActions.textContent = "--";
    return false;
  }
}

function updatePendingBadge(count) {
  if (count > 0) {
    elements.pendingBadge.textContent = String(count);
    elements.pendingBadge.classList.remove("hidden");
  } else {
    elements.pendingBadge.classList.add("hidden");
  }

  // Notify background script to update browser action badge
  if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ action: "UPDATE_BADGE" }).catch(() => { });
  }
}

// Fetch Sources (/api/sources)
async function fetchSources() {
  try {
    const resp = await fetch(`${apiBaseUrl}/api/sources`);
    if (!resp.ok) return;
    const data = await resp.json();
    const sources = data.sources || [];

    elements.sourcesSummary.textContent = `${sources.length} registered`;
    elements.sourcesTableBody.innerHTML = "";

    if (sources.length === 0) {
      elements.sourcesTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No telemetry feeds recorded.</td></tr>`;
      return;
    }

    sources.forEach((s) => {
      const tr = document.createElement("tr");
      const statusClass = s.status === "ACTIVE" ? "badge-green" : s.status === "STALE" ? "badge-amber" : "badge-slate";
      tr.innerHTML = `
        <td><strong>${escapeHtml(s.source)}</strong></td>
        <td><code>${escapeHtml(s.host)}</code></td>
        <td>${s.event_count}</td>
        <td><span class="badge ${statusClass}">${s.status}</span></td>
      `;
      elements.sourcesTableBody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error fetching sources:", err);
  }
}

// Fetch Events (/api/events)
async function fetchEvents(severity = "") {
  try {
    let url = `${apiBaseUrl}/api/events?limit=100`;
    if (severity) {
      url += `&severity=${encodeURIComponent(severity)}`;
    }
    const resp = await fetch(url);
    if (!resp.ok) return;
    const data = await resp.json();
    const events = data.events || [];

    // Severity Breakdown
    let crit = 0, high = 0, med = 0, low = 0, info = 0;
    events.forEach((e) => {
      const sev = (e.severity || "").toLowerCase();
      if (sev === "critical") crit++;
      else if (sev === "high") high++;
      else if (sev === "medium") med++;
      else if (sev === "low") low++;
      else info++;
    });

    const total = events.length || 1;
    elements.sevBarCrit.style.width = `${(crit / total) * 100}%`;
    elements.sevBarHigh.style.width = `${(high / total) * 100}%`;
    elements.sevBarMed.style.width = `${(med / total) * 100}%`;
    elements.sevBarLow.style.width = `${(low / total) * 100}%`;
    elements.sevBarInfo.style.width = `${(info / total) * 100}%`;

    elements.metricHighCrit.textContent = String(crit + high);
    elements.severityCountsText.textContent = `Crit: ${crit} | High: ${high} | Med: ${med} | Low: ${low} | Info: ${info}`;

    // Populate Events Table
    elements.eventsTableBody.innerHTML = "";
    if (events.length === 0) {
      elements.eventsTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No security events found.</td></tr>`;
      return;
    }

    events.slice(0, 25).forEach((e) => {
      const tr = document.createElement("tr");
      const sevClass = getSeverityBadgeClass(e.severity);
      const timeStr = formatShortTime(e.timestamp);

      tr.innerHTML = `
        <td class="text-muted">${timeStr}</td>
        <td><span class="badge ${sevClass}">${(e.severity || "info").toUpperCase()}</span></td>
        <td><code>${escapeHtml(e.event_type)}</code></td>
        <td>${escapeHtml(e.host)}</td>
        <td title="${escapeHtml(e.message)}">${escapeHtml(truncate(e.message, 45))}</td>
      `;
      elements.eventsTableBody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error fetching events:", err);
  }
}

// Fetch Evidence (/api/evidence)
async function fetchEvidence() {
  try {
    const resp = await fetch(`${apiBaseUrl}/api/evidence?limit=100`);
    if (!resp.ok) return;
    const data = await resp.json();

    const isIntact = data.ledger_valid;
    const tamperedCount = data.tampered_count || 0;
    const totalRecords = data.total_records || 0;

    elements.metricEvidenceStatus.textContent = isIntact ? "VERIFIED" : "TAMPERED";
    elements.metricEvidenceStatus.className = `metric-value ${isIntact ? "text-green" : "text-red"}`;

    elements.evidenceBlocksTotal.textContent = `${totalRecords} blocks sealed`;

    if (isIntact) {
      elements.evidenceIntegrityBanner.className = "evidence-banner banner-valid";
      elements.evidenceBannerIcon.textContent = "🛡️";
      elements.evidenceBannerTitle.textContent = "Cryptographic Evidence Ledger: 100% INTACT & VERIFIED";
      elements.evidenceBannerSubtitle.textContent = "All canonical event hashes, HMAC signatures, and Merkle block linkages verified.";
      elements.tamperViolationsAlert.classList.add("hidden");
    } else {
      elements.evidenceIntegrityBanner.className = "evidence-banner banner-tampered";
      elements.evidenceBannerIcon.textContent = "⚠️";
      elements.evidenceBannerTitle.textContent = "CRITICAL: EVIDENCE TAMPERING DETECTED!";
      elements.evidenceBannerSubtitle.textContent = `Integrity audit flagged ${tamperedCount} tampered evidence record(s) or invalid chain hashes.`;

      elements.tamperViolationsAlert.classList.remove("hidden");
      const violations = data.violations || [];
      elements.tamperViolationsList.innerHTML = violations
        .map(
          (v) => `<div>• Record <code>${v.evidence_id || v.event_id}</code>: <strong>${v.reason}</strong> (Index #${v.index})</div>`
        )
        .join("");
    }

    // Populate Evidence Table
    elements.evidenceTableBody.innerHTML = "";
    const records = data.records || [];
    if (records.length === 0) {
      elements.evidenceTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No evidence records sealed yet.</td></tr>`;
      return;
    }

    records.slice(0, 30).forEach((r) => {
      const tr = document.createElement("tr");
      const isRecordTampered = r.integrity_status === "TAMPERED";
      const statusBadge = isRecordTampered
        ? `<span class="badge badge-red">TAMPERED</span>`
        : `<span class="badge badge-green">VERIFIED</span>`;

      tr.innerHTML = `
        <td><code>${escapeHtml(r.evidence_id)}</code></td>
        <td><code>${escapeHtml(r.event_id)}</code></td>
        <td title="${r.canonical_hash}"><code>${escapeHtml(truncate(r.canonical_hash, 12))}</code></td>
        <td title="${r.signature}"><code>${escapeHtml(truncate(r.signature, 10))}</code></td>
        <td title="${r.chain_hash}"><code>${escapeHtml(truncate(r.chain_hash, 10))}</code></td>
        <td class="text-muted">${formatShortTime(r.timestamp)}</td>
        <td>${statusBadge}</td>
      `;
      elements.evidenceTableBody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error fetching evidence:", err);
  }
}

// Fetch Actions (/api/actions)
async function fetchActions() {
  try {
    const resp = await fetch(`${apiBaseUrl}/api/actions?limit=100`);
    if (!resp.ok) return;
    const data = await resp.json();
    const actions = data.actions || [];

    const pending = actions.filter((a) => a.status === "PENDING_APPROVAL");
    const decided = actions.filter((a) => a.status !== "PENDING_APPROVAL");

    elements.approvalsPendingCount.textContent = `${pending.length} Pending`;
    elements.approvalsPendingCount.className = `badge ${pending.length > 0 ? "badge-amber" : "badge-green"}`;
    updatePendingBadge(pending.length);

    // Render Pending Action Cards
    elements.pendingActionsList.innerHTML = "";
    if (pending.length === 0) {
      elements.pendingActionsList.innerHTML = `<div class="empty-state">No response actions pending authorization. All containment rules nominal.</div>`;
    } else {
      pending.forEach((act) => {
        const card = document.createElement("div");
        card.className = "action-card";
        card.innerHTML = `
          <div class="action-card-header">
            <div class="action-title-group">
              <span class="action-type">${escapeHtml(act.action_type)}</span>
              <span class="badge ${act.risk_level === "high" ? "badge-red" : "badge-amber"}">RISK: ${act.risk_level.toUpperCase()}</span>
              <span class="badge badge-slate">ID: ${escapeHtml(act.action_id)}</span>
            </div>
            <span class="text-muted">${formatShortTime(act.created_at)}</span>
          </div>
          <p class="action-desc">${escapeHtml(act.description)}</p>
          <div class="action-desc">
            <strong>Target:</strong> <code>${escapeHtml(act.target_entity)}</code> on host <code>${escapeHtml(act.target_host)}</code> | <strong>Rule:</strong> ${escapeHtml(act.rule_id)}
          </div>
          <div class="action-form-row">
            <input type="text" id="approver_${act.action_id}" class="form-input form-select-sm" placeholder="Approver Email" value="operator@aegisx.local" style="max-width: 170px;">
            <input type="text" id="justification_${act.action_id}" class="form-input form-select-sm" placeholder="Containment Justification" value="Authorized simulated incident mitigation">
            <button class="btn btn-sm btn-success btn-approve" data-id="${act.action_id}">✓ Approve</button>
            <button class="btn btn-sm btn-danger btn-reject" data-id="${act.action_id}">✗ Reject</button>
          </div>
        `;
        elements.pendingActionsList.appendChild(card);
      });

      // Attach decision event handlers
      elements.pendingActionsList.querySelectorAll(".btn-approve").forEach((btn) => {
        btn.addEventListener("click", () => submitActionDecision(btn.getAttribute("data-id"), "approve"));
      });
      elements.pendingActionsList.querySelectorAll(".btn-reject").forEach((btn) => {
        btn.addEventListener("click", () => submitActionDecision(btn.getAttribute("data-id"), "reject"));
      });
    }

    // Render History Table
    elements.actionsHistoryCount.textContent = `${decided.length} decided`;
    elements.actionsHistoryTableBody.innerHTML = "";
    if (decided.length === 0) {
      elements.actionsHistoryTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No decided actions in history.</td></tr>`;
    } else {
      decided.forEach((act) => {
        const tr = document.createElement("tr");
        const statusBadge =
          act.status === "EXECUTED_SIMULATED"
            ? `<span class="badge badge-green">EXECUTED (SIM)</span>`
            : `<span class="badge badge-red">REJECTED</span>`;

        tr.innerHTML = `
          <td><code>${escapeHtml(act.action_id)}</code></td>
          <td><strong>${escapeHtml(act.action_type)}</strong></td>
          <td><code>${escapeHtml(act.target_entity)}</code></td>
          <td>${statusBadge}</td>
          <td>${escapeHtml(act.approver || "--")}</td>
          <td class="text-muted">${formatShortTime(act.decision_at)}</td>
          <td title="${escapeHtml(act.simulated_execution_log || "")}">${escapeHtml(truncate(act.simulated_execution_log || "--", 35))}</td>
        `;
        elements.actionsHistoryTableBody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error("Error fetching actions:", err);
  }
}

// Submit Human Decision (/api/actions/approve)
async function submitActionDecision(actionId, decision) {
  const approverInput = document.getElementById(`approver_${actionId}`);
  const justInput = document.getElementById(`justification_${actionId}`);
  const approver = approverInput ? approverInput.value.trim() : "operator@aegisx.local";
  const justification = justInput ? justInput.value.trim() : "Operator decision";

  try {
    const payload = {
      action_id: actionId,
      decision: decision,
      approver: approver || "operator@aegisx.local",
      justification: justification || "Operator decision",
    };

    const resp = await fetch(`${apiBaseUrl}/api/actions/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const err = await resp.json();
      alert(`Approval error: ${err.detail || "Request failed"}`);
      return;
    }

    await fetchActions();
    await fetchStatus();
  } catch (err) {
    alert(`Failed to submit decision: ${err.message}`);
  }
}

// Multi-Agent AI Investigation (/api/investigate)
async function runInvestigation() {
  const query = elements.invQueryInput.value.trim();
  const focus = elements.invFocusSelect.value;

  elements.invBtnText.textContent = "Analyzing...";
  elements.invSpinner.classList.remove("hidden");
  elements.btnRunInvestigation.disabled = true;

  try {
    const resp = await fetch(`${apiBaseUrl}/api/investigate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query || "Investigate incident", focus: focus }),
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const data = await resp.json();
    elements.investigationResults.classList.remove("hidden");

    elements.invSummaryText.textContent = data.summary;
    elements.invConfidenceBadge.textContent = `Confidence: ${Math.round((data.confidence_score || 0.9) * 100)}%`;
    elements.invEvidenceBadge.textContent = `Evidence: ${data.evidence_verdict || "VERIFIED"}`;
    elements.invEvidenceBadge.className = `badge ${data.evidence_verdict === "VERIFIED" ? "badge-green" : "badge-red"}`;
    elements.invIdBadge.textContent = `ID: ${data.investigation_id || "inv"}`;

    // MITRE Tags
    elements.invMitreTags.innerHTML = "";
    (data.mitre_tactics || []).forEach((tag) => {
      const span = document.createElement("span");
      span.className = "mitre-tag";
      span.textContent = tag;
      elements.invMitreTags.appendChild(span);
    });

    // Agent Findings
    (data.findings || []).forEach((f) => {
      if (f.agent === "TriageAgent") {
        elements.triageVerdict.textContent = f.verdict;
        elements.triageScore.textContent = `${Math.round(f.confidence * 100)}%`;
      } else if (f.agent === "EvidenceAgent") {
        elements.evidenceVerdict.textContent = f.verdict;
        elements.evidenceScore.textContent = `${Math.round(f.confidence * 100)}%`;
      } else if (f.agent === "ThreatHunterAgent") {
        elements.hunterVerdict.textContent = f.verdict;
        elements.hunterScore.textContent = `${Math.round(f.confidence * 100)}%`;
      }
    });

    // Timeline
    const timeline = data.correlated_timeline || [];
    elements.timelineCount.textContent = `${timeline.length} events correlated`;
    elements.timelineList.innerHTML = "";

    if (timeline.length === 0) {
      elements.timelineList.innerHTML = `<div class="empty-state">No correlated events in this time window.</div>`;
    } else {
      timeline.forEach((item) => {
        const div = document.createElement("div");
        div.className = "timeline-item";
        div.innerHTML = `
          <span class="timeline-time">${formatShortTime(item.timestamp)}</span>
          <span class="badge ${getSeverityBadgeClass(item.severity)}">${(item.severity || "info").toUpperCase()}</span>
          <span class="timeline-msg"><strong>[${escapeHtml(item.host)}]</strong> ${escapeHtml(item.message)}</span>
        `;
        elements.timelineList.appendChild(div);
      });
    }
  } catch (err) {
    alert(`Investigation failed: ${err.message}`);
  } finally {
    elements.invBtnText.textContent = "Investigate";
    elements.invSpinner.classList.add("hidden");
    elements.btnRunInvestigation.disabled = false;
  }
}

// Run Simulation Scenario (/api/scenario/run)
async function runSimulation() {
  const targetHost = elements.simHostInput.value.trim() || "srv-prod-db01";
  const targetAccount = elements.simAccountInput.value.trim() || "admin";
  const scenarioName = elements.simScenarioSelect.value;

  elements.simBtnText.textContent = "Simulating...";
  elements.simSpinner.classList.remove("hidden");
  elements.btnRunScenario.disabled = true;

  try {
    const resp = await fetch(`${apiBaseUrl}/api/scenario/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_host: targetHost,
        target_account: targetAccount,
        scenario_name: scenarioName,
      }),
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const data = await resp.json();
    elements.simResultsContainer.classList.remove("hidden");

    elements.simEventsCount.textContent = String(data.events_generated_count || 0);
    elements.simFindingsCount.textContent = String((data.detection_findings || []).length);
    elements.simTamperAlert.textContent = data.evidence_ledger_integrity?.tamper_detected ? "CAUGHT" : "CLEAN";
    elements.simActionsCount.textContent = String((data.pending_approval_actions || []).length);

    elements.simFindingsList.innerHTML = "";
    (data.detection_findings || []).forEach((f) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${escapeHtml(f.rule_id)}:</strong> ${escapeHtml(f.explanation)}`;
      elements.simFindingsList.appendChild(li);
    });

    // Refresh dashboard, evidence, and approvals
    await refreshAll(false);
  } catch (err) {
    alert(`Simulation failed: ${err.message}`);
  } finally {
    elements.simBtnText.textContent = "⚡ Run Safe Simulation";
    elements.simSpinner.classList.add("hidden");
    elements.btnRunScenario.disabled = false;
  }
}

// Natural Language Voice Query (/api/voice/query)
async function runVoiceQuery() {
  const query = elements.voiceQueryInput.value.trim();
  if (!query) return;

  elements.voiceBtnText.textContent = "Processing...";
  elements.voiceSpinner.classList.remove("hidden");
  elements.btnVoiceSubmit.disabled = true;

  try {
    const resp = await fetch(`${apiBaseUrl}/api/voice/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query_text: query }),
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const data = await resp.json();
    elements.voiceResponseCard.classList.remove("hidden");

    elements.voiceSpeechText.textContent = `"${data.speech_text}"`;
    elements.voiceIntentTag.textContent = `Intent: ${data.intent}`;
    elements.voiceQueryEcho.textContent = `Query: "${data.query_text}"`;
    elements.voicePayloadJson.textContent = JSON.stringify(data.data_payload, null, 2);
  } catch (err) {
    alert(`Voice query failed: ${err.message}`);
  } finally {
    elements.voiceBtnText.textContent = "🎙️ Query SOC";
    elements.voiceSpinner.classList.add("hidden");
    elements.btnVoiceSubmit.disabled = false;
  }
}

// Utility Helpers
function getSeverityBadgeClass(sev) {
  const s = (sev || "").toLowerCase();
  if (s === "critical") return "badge-red";
  if (s === "high") return "badge-amber";
  if (s === "medium") return "badge-amber";
  if (s === "low") return "badge-cyan";
  return "badge-slate";
}

function formatShortTime(iso) {
  if (!iso) return "--:--:--";
  try {
    const d = new Date(iso);
    return d.toTimeString().split(" ")[0];
  } catch {
    return iso;
  }
}

function truncate(str, len) {
  if (!str) return "";
  return str.length > len ? str.substring(0, len) + "..." : str;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
