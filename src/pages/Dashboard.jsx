import React from 'react';
import { useSentinel } from '../hooks/useSentinel';
import { Header } from '../components/Header';
import { MainActionBanner } from '../components/MainActionBanner';
import { SourceCard } from '../components/SourceCard';
import { IncidentSummaryCard } from '../components/IncidentSummaryCard';
import { TimelineEvent } from '../components/TimelineEvent';
import { EvidenceCard } from '../components/EvidenceCard';
import { InvestigationCard } from '../components/InvestigationCard';
import { ApprovalCard } from '../components/ApprovalCard';
import { AskAegisConsole } from '../components/AskAegisConsole';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import {
  Activity,
  Clock,
  FileCheck2,
  Users2,
  Zap,
  ShieldAlert,
  Lock
} from 'lucide-react';

export function Dashboard() {
  const {
    status,
    sources,
    incident,
    events,
    evidence,
    chainValid,
    investigations,
    containmentAction,
    voiceHistory,
    loading,
    isSimulating,
    simulationResult,
    isApproving,
    isQueryingVoice,
    connectionMode,
    isMockData,
    error,
    refreshAll,
    runSimulation,
    approveAction,
    askAegis,
    resetSimulation,
    toggleMockMode
  } = useSentinel();

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-text-primary p-6 flex items-center justify-center">
        <LoadingState message="Connecting to AEGISX Sentinel Telemetry Fabric..." />
      </div>
    );
  }

  const hasEvents = events && events.length > 0;

  return (
    <div className="min-h-screen bg-background text-text-primary p-4 md:p-6 max-w-[1600px] mx-auto font-sans transition-colors duration-200">
      {/* Header */}
      <Header
        status={status}
        connectionMode={connectionMode}
        isMockData={isMockData}
        onRefresh={refreshAll}
        onToggleMock={toggleMockMode}
        isRefreshing={loading}
      />

      {/* Global Error Banner if any */}
      {error && (
        <ErrorState error={error} onRetry={refreshAll} />
      )}

      {/* Main Simulation Action */}
      <MainActionBanner
        onRunSimulation={runSimulation}
        onResetSimulation={resetSimulation}
        isSimulating={isSimulating}
        simulationResult={simulationResult}
        hasSimulated={hasEvents}
      />

      {/* SECTION 1 — SOURCE HEALTH ROW */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">
              Section 1 // Telemetry Source Health & Trust Status
            </h2>
          </div>
          <span className="text-[11px] font-mono text-text-secondary">
            5 / 5 Ingestion Feeds Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {sources.map((src) => (
            <SourceCard key={src.id || src.name} source={src} />
          ))}
        </div>
      </section>

      {/* TWO-COLUMN ENTERPRISE SOC LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* LEFT COLUMN: PRIMARY VISUAL ELEMENTS (TIMELINE & INVESTIGATION) */}
        <div className="lg:col-span-7 space-y-4">

          {/* SECTION 3 — ATTACK TIMELINE (PRIMARY VISUAL ELEMENT) */}
          <section className="soc-card p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                <div>
                  <h2 className="text-sm font-semibold text-text-primary tracking-tight">
                    Section 3 // Attack Timeline
                  </h2>
                  <p className="text-[11px] font-mono text-text-secondary">
                    Chronological incident events & cryptographic trace
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface border border-border text-text-secondary">
                {events.length} Telemetry Events
              </span>
            </div>

            {hasEvents ? (
              <div className="space-y-0.5">
                {events.map((evt, idx) => (
                  <TimelineEvent
                    key={evt.id}
                    event={evt}
                    isLast={idx === events.length - 1}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Timeline Nominal — No Attack Activity"
                message="Click 'Run Attack Simulation' to inject telemetry events across IAM, EDR, Host, and Database sensors."
              />
            )}
          </section>

          {/* SECTION 5 — MULTI-AGENT INVESTIGATION */}
          <section className="soc-card p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Users2 className="w-4 h-4 text-accent" />
                <div>
                  <h2 className="text-sm font-semibold text-text-primary tracking-tight">
                    Section 5 // Multi-Agent AI Investigation Team
                  </h2>
                  <p className="text-[11px] font-mono text-text-secondary">
                    Autonomous agent consensus from specialized cybersecurity models
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface border border-border text-text-secondary">
                {investigations.length} Agents Active
              </span>
            </div>

            {investigations && investigations.length > 0 ? (
              <div className="space-y-3">
                {investigations.map((finding, idx) => (
                  <InvestigationCard key={idx} finding={finding} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Investigation Buffer Idle"
                message="Multi-agent analysis activates when anomalous event telemetry is detected."
              />
            )}
          </section>

        </div>

        {/* RIGHT COLUMN: EXECUTIVE SUMMARY, DECISION, EVIDENCE, AND ANALYST CONSOLE */}
        <div className="lg:col-span-5 space-y-4">

          {/* SECTION 2 — INCIDENT SUMMARY */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-accent" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">
                Section 2 // Executive Incident Summary
              </h2>
            </div>
            <IncidentSummaryCard incident={incident} />
          </section>

          {/* SECTION 7 — CONTAINMENT DECISION */}
          <section className="soc-card p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                <div>
                  <h2 className="text-sm font-semibold text-text-primary tracking-tight">
                    Section 7 // Containment Decision & Human Authorization
                  </h2>
                  <p className="text-[11px] font-mono text-text-secondary">
                    Human-in-the-loop safe containment execution
                  </p>
                </div>
              </div>
            </div>

            <ApprovalCard
              action={containmentAction}
              onApprove={approveAction}
              isApproving={isApproving}
            />
          </section>

          {/* SECTION 4 — EVIDENCE VERIFICATION */}
          <section className="soc-card p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-accent" />
                <div>
                  <h2 className="text-sm font-semibold text-text-primary tracking-tight">
                    Section 4 // Cryptographic Evidence Integrity
                  </h2>
                  <p className="text-[11px] font-mono text-text-secondary">
                    Tamper-proof hash & signature verification audit log
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                <Lock className="w-3 h-3" />
                <span>Merkle Chain: {chainValid ? 'Intact' : 'Warning'}</span>
              </div>
            </div>

            {evidence && evidence.length > 0 ? (
              <div className="space-y-2">
                {evidence.map((evItem) => (
                  <EvidenceCard key={evItem.id} evidence={evItem} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Evidence Records"
                message="Cryptographic verification records populate automatically during ingestion."
              />
            )}
          </section>

          {/* SECTION 6 — ASK AEGISX ANALYST CONSOLE */}
          <section className="soc-card p-4">
            <AskAegisConsole
              history={voiceHistory}
              onAsk={askAegis}
              isQuerying={isQueryingVoice}
            />
          </section>

        </div>

      </div>

      {/* FOOTER */}
      <footer className="mt-8 pt-4 border-t border-border text-center text-xs font-mono text-text-secondary flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          <span>AEGISX Sentinel // Autonomous SOC First Responder</span>
          <span className="mx-2">•</span>
          <span>Hackathon Demo Edition</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Zero Hardcoded Telemetry
          </span>
          <span className="text-border">|</span>
          <span>Light Enterprise SOC Theme</span>
        </div>
      </footer>
    </div>
  );
}
