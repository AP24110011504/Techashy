# AEGISX Sentinel — Chrome Extension (Manifest V3)
**SOC Cyber Evidence & Investigation Dashboard**

This Chrome Extension delivers an analyst dashboard connected to the AEGISX Sentinel FastAPI backend.

---

## Features
- **Real-time SOC Overview**: System status, telemetry sensor health, and event severity breakdown.
- **Incident Investigation**: Trigger multi-agent AI incident analysis (Triage, Evidence, Threat Hunter) with MITRE ATT&CK mapping.
- **Incident Simulator**: Run safe 5-stage cyber incident demonstrations covering credential bursts, egress anomalies, privileged database access, sensor heartbeat loss, and log tampering.
- **Evidence Ledger**: Real-time cryptographic ledger audit verifying SHA-256 canonical event hashes and HMAC-SHA256 Merkle chain blocks.
- **Human-in-the-Loop Response Approvals**: Review pending containment actions (`ISOLATE_HOST`, `REVOKE_CREDENTIALS`, `BLOCK_IP`, `RESTART_EDR_SENSOR`) and submit simulated approval or rejection decisions.
- **Voice SOC Assistant**: Natural language query interface with synthesized verbal responses and structured card data.

---

## How to Load the Extension in Chrome (Developer Mode)

### Step 1: Ensure Backend is Running
Before loading the extension, make sure the AEGISX Sentinel backend is active:

```bash
cd Techashy
python -m sentinel.main
```
Verify the API is available at [http://127.0.0.1:8000/api/status](http://127.0.0.1:8000/api/status).

### Step 2: Open Chrome Extensions
1. Open Google Chrome (or Chromium / Edge / Brave).
2. Navigate to `chrome://extensions/` in the URL address bar.
3. In the top-right corner, toggle **Developer mode** to **ON**.

### Step 3: Load Unpacked Extension
1. Click the **Load unpacked** button in the top-left toolbar.
2. Select the `Techashy/extension` directory from your file browser:
   - Path: `<path-to-repo>/Techashy/extension`
3. The **AEGISX Sentinel — Cyber Evidence & Investigation SOC** extension card will appear in your extensions list.

### Step 4: Open the Dashboard
1. Click the Extensions (puzzle piece) icon in Chrome's top-right toolbar.
2. Pin **AEGISX Sentinel** to the toolbar.
3. Click the AEGISX Sentinel shield icon to launch the SOC dashboard!

---

## Extension Structure
- `manifest.json`: Manifest V3 configuration with minimal permissions (`storage`, localhost host permissions).
- `popup.html`: Professional cybersecurity SOC user interface.
- `popup.css`: Dark-themed cyber command center styling.
- `popup.js`: Controller managing API calls, real-time polling, and UI state.
- `background.js`: Service worker managing extension badge counters for pending approvals.
- `icons/`: Extension icons (16px, 48px, 128px).
