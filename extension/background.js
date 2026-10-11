// AEGISX Sentinel Manifest V3 Background Service Worker

const DEFAULT_API_BASE = "http://127.0.0.1:8000";

async function getApiBase() {
  try {
    const res = await chrome.storage.local.get(["apiBaseUrl"]);
    return res.apiBaseUrl || DEFAULT_API_BASE;
  } catch {
    return DEFAULT_API_BASE;
  }
}

async function updateBadge() {
  const apiBase = await getApiBase();
  try {
    const resp = await fetch(`${apiBase}/api/actions?status=PENDING_APPROVAL`);
    if (!resp.ok) {
      chrome.action.setBadgeText({ text: "ERR" });
      chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
      return;
    }
    const data = await resp.json();
    const count = data.pending_count || 0;
    if (count > 0) {
      chrome.action.setBadgeText({ text: String(count) });
      chrome.action.setBadgeBackgroundColor({ color: "#f59e0b" });
    } else {
      chrome.action.setBadgeText({ text: "" });
    }
  } catch {
    chrome.action.setBadgeText({ text: "OFF" });
    chrome.action.setBadgeBackgroundColor({ color: "#64748b" });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("AEGISX Sentinel extension installed.");
  updateBadge();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "UPDATE_BADGE") {
    updateBadge();
    sendResponse({ success: true });
  }
  return true;
});
