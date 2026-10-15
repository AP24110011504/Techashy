
import React from 'react';
import {
  Play,
  RotateCcw,
  Download,
  ShieldAlert,
  Clock,
  Server,
  Activity,
  ArrowRight,
} from 'lucide-react';

import { MetricCard } from '../components/dashboard/MetricCard';
import { AttackTopology } from '../components/dashboard/AttackTopology';
import { SentinelCopilot } from '../components/dashboard/SentinelCopilot';
import { LiveThreatStream } from '../components/dashboard/LiveThreatStream';
import { AttackTimeline } from '../components/dashboard/AttackTimeline';
import { ForensicLockbox } from '../components/dashboard/ForensicLockbox';
import { SourceHealthGrid } from '../components/dashboard/SourceHealthGrid';
import { exportAuditLogCSV, exportEvidenceBundle } from '../utils/exportUtils';

export function OverviewPage({
  incident,
  sources = [],
  events = [],
  evidence = [],
  investigations = [],
  voiceHistory = [],
  auditLog = [],
  onRunSimulation,
  onResetSimulation,
  isSimulating,
  simulationResult,
  onAskCopilot,
  isQueryingVoice,
  onNavigate,
}) {
  const normalizedEvents = Array.isArray(events) ? events : [];
  const normalizedSources = Array.isArray(sources) ? sources : [];
  const normalizedEvidence = Array.isArray(evidence) ? evidence : [];
  const normalizedFindings = Array.isArray(investigations) ? investigations : [];

  const highSeverityEvents = normalizedEvents.filter((event) =>
    ['HIGH', 'CRITICAL'].includes(
      String(event.severity || '').toUpperCase()
    )
  );

  const criticalEventCount = normalizedEvents.filter(
    (event) => String(event.severity || '').toUpperCase() === 'CRITICAL'
  ).length;

  const highSeverityCount = highSeverityEvents.length;
  const activeIncidentCount = normalizedEvents.length > 0 ? 1 : 0;

  const affectedHosts = new Set(
    highSeverityEvents.map((event) => event.host).filter(Boolean)
  );

  const hostsInDangerCount = affectedHosts.size;

  // This is a severity ratio, not a validated risk score.
  const severityRatio = normalizedEvents.length
    ? Math.round((highSeverityCount / normalizedEvents.length) * 100)
    : 0;

  const evidenceStatuses = normalizedEvidence.map((record) =>
    String(
      record.verification_status ??
      record.verificationStatus ??
      ''
    ).toLowerCase()
  );

  const missingEvidenceCount = normalizedEvents.filter((event) => {
    const status = String(
      event.verification_status ??
      event.verificationStatus ??
      ''
    ).toLowerCase();

    return !status || status === 'missing' || status === 'unverifiable';
  }).length;

  const hasMissingEvidence =
    missingEvidenceCount > 0 ||
    evidenceStatuses.includes('missing') ||
    evidenceStatuses.includes('unverifiable');

  const hasVerifiedEvidence =
    evidenceStatuses.length > 0 &&
    evidenceStatuses.every((status) => status === 'verified');

  const hasIncident = normalizedEvents.length > 0;

  const handleExportAudit = () => {
    exportAuditLogCSV(auditLog);
  };

  const handleDownloadEvidenceBundle = () => {
    exportEvidenceBundle(normalizedEvidence, incident);
  };

  const threatLabel = criticalEventCount > 0
    ? 'CRITICAL EVENTS DETECTED'
    : highSeverityCount > 0
      ? 'HIGH-SEVERITY EVENTS DETECTED'
      : hasIncident
        ? 'EVENTS OBSERVED'
        : 'NO EVENTS RETURNED';

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-[#E1E5ED] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-extrabold uppercase border ${
                highSeverityCount > 0
                  ? 'bg-[#FFF1F0] text-[#C9362B] border-[#FCA5A5]'
                  : 'bg-[#F5F5F9] text-[#475569] border-[#E1E5ED]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  highSeverityCount > 0 ? 'bg-[#C9362B]' : 'bg-[#94A3B8]'
                }`}
              />
              {threatLabel}
            </span>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F5F5F9] border border-[#E1E5ED] text-[#718096] font-bold">
              BACKEND DATA
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight font-sans">
            Security Operations Command
          </h1>

          <p className="text-xs text-[#718096] mt-0.5">
            Incident status derived from returned backend telemetry
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportAudit}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#172033] bg-white border border-[#E1E5ED] hover:bg-[#F5F5F9] transition-all flex items-center gap-2 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#718096]" />
            <span>Export Audit Log</span>
          </button>

          {hasIncident && (
            <button
              onClick={onResetSimulation}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#718096] bg-white border border-[#E1E5ED] hover:bg-[#F5F5F9] transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh Data</span>
            </button>
          )}

          <button
            onClick={onRunSimulation}
            disabled={isSimulating}
            className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-[#C9362B] hover:bg-[#B92F26] disabled:opacity-60 shadow-sm transition-all flex items-center gap-2"
          >
            {isSimulating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Requesting Simulation...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Run Threat Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {simulationResult && (
        <div className="p-3.5 rounded-xl bg-[#F5F5F9] border border-[#E1E5ED] flex items-center justify-between gap-4 text-xs">
          <div className="text-[#172033]">
            <strong>Backend response</strong>
            <p>{simulationResult.message || 'Response received.'}</p>
          </div>

          <button
            onClick={() => onNavigate && onNavigate('/incidents')}
            className="text-[11px] font-mono font-bold text-[#C9362B] hover:underline flex-shrink-0 flex items-center gap-1"
          >
            <span>Review Events</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Incidents With Events"
          value={activeIncidentCount}
          subvalue={`${normalizedEvents.length} returned events`}
          icon={ShieldAlert}
          variant={highSeverityCount > 0 ? 'danger' : 'default'}
          badgeText={highSeverityCount > 0 ? 'REVIEW REQUIRED' : 'OBSERVED'}
          detailText={
            hasIncident
              ? 'One incident ID is represented in the loaded event set.'
              : 'No event records were returned by the backend.'
          }
        />

        <MetricCard
          title="Containment Time"
          value="N/A"
          subvalue="Not measured"
          icon={Clock}
          variant="default"
          badgeText="UNCONFIRMED"
          detailText="No containment execution time is available."
        />

        <MetricCard
          title="Hosts in Danger"
          value={hostsInDangerCount}
          subvalue="Distinct hosts in high-severity events"
          icon={Server}
          variant={hostsInDangerCount > 0 ? 'danger' : 'default'}
          badgeText="FROM EVENTS"
          detailText={
            hostsInDangerCount > 0
              ? 'Counted from host fields in returned events.'
              : 'No affected host names are available in returned events.'
          }
        />

        <MetricCard
          title="High-Severity Event Ratio"
          value={`${severityRatio}%`}
          subvalue={`${highSeverityCount} of ${normalizedEvents.length} events`}
          icon={Activity}
          variant={highSeverityCount > 0 ? 'danger' : 'default'}
          badgeText={
            hasMissingEvidence
              ? 'EVIDENCE MISSING'
              : hasVerifiedEvidence
                ? 'EVIDENCE VERIFIED'
                : 'VERIFY STATUS'
          }
          detailText="Severity ratio only; this is not a validated risk score."
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8">
          <AttackTopology
            incident={incident}
            events={normalizedEvents}
            onSelectHost={() => onNavigate && onNavigate('/containment')}
          />
        </div>

        <div className="xl:col-span-4">
          <SentinelCopilot
            history={voiceHistory}
            investigations={normalizedFindings}
            onAsk={onAskCopilot}
            isQuerying={isQueryingVoice}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <LiveThreatStream
          events={normalizedEvents}
          onSelectEvent={() => onNavigate && onNavigate('/incidents')}
        />

        <AttackTimeline
          events={normalizedEvents}
          onSelectEvent={() => onNavigate && onNavigate('/incidents')}
        />

        <ForensicLockbox
          evidence={normalizedEvidence}
          onDownloadBundle={handleDownloadEvidenceBundle}
          onSelectArtifact={() => onNavigate && onNavigate('/forensics')}
        />
      </div>

      <section className="rounded-xl border border-[#E1E5ED] bg-white p-4">
        <h2 className="text-sm font-bold text-[#172033] mb-2">
          Evidence and source status
        </h2>

        <p className="text-xs text-[#475569]">
          Sources returned: {normalizedSources.length}. Evidence records returned:{' '}
          {normalizedEvidence.length}.
        </p>

        <p className="text-xs mt-2 text-[#475569]">
          {hasMissingEvidence
            ? `Warning: ${missingEvidenceCount} loaded events lack verified evidence status.`
            : hasVerifiedEvidence
              ? 'All returned evidence records are marked verified by the backend.'
              : 'Evidence integrity is unconfirmed. Do not assume the chain is valid.'}
        </p>
      </section>

      <SourceHealthGrid sources={normalizedSources} />

      <footer className="pt-4 border-t border-[#E1E5ED] text-center text-xs font-mono text-[#718096]">
        AEGISX Sentinel // Backend-derived telemetry // Containment is not confirmed unless the backend reports it
      </footer>
    </div>
  );
}
