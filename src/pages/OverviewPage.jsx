import React from 'react';
import {
  Play,
  RotateCcw,
  Download,
  ShieldAlert,
  Clock,
  Server,
  Activity,
  AlertTriangle,
  Radio,
  FileCheck2,
  CheckCircle2,
  ArrowRight
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
  onNavigate
}) {
  const isCritical = incident?.severity === 'CRITICAL' || (incident?.threatScore && incident.threatScore > 50);
  const activeIncidentsCount = isCritical ? 1 : 0;
  const hostsInDangerCount = isCritical ? (incident?.affectedAssets?.length || 3) : 0;
  const threatScore = isCritical ? (incident?.threatScore || 87) : 12;

  const handleExportAudit = () => {
    exportAuditLogCSV(auditLog);
  };

  const handleDownloadEvidenceBundle = () => {
    exportEvidenceBundle(evidence, incident);
  };

  return (
    <div className="space-y-6">
      {/* 6.1 PAGE HEADING & PRIMARY SIMULATION CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-[#E1E5ED] gap-4">
        <div>
          {/* Severity Indicator Badge */}
          <div className="flex items-center gap-2 mb-1.5">
            {isCritical ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-extrabold uppercase bg-[#FFF1F0] text-[#C9362B] border border-[#FCA5A5] shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#C9362B] animate-danger-pulse" />
                CRITICAL THREAT ACTIVE • DANGER LEVEL 1
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                SYSTEM NOMINAL • STANDBY
              </span>
            )}

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F5F5F9] border border-[#E1E5ED] text-[#718096] font-bold">
              LIVE SOC DEMO
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight font-sans">
            Security Operations Command
          </h1>
          <p className="text-xs text-[#718096] mt-0.5">
            Autonomous cybersecurity first responder with real-time lateral containment
          </p>
        </div>

        {/* Right-Aligned Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportAudit}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#172033] bg-white border border-[#E1E5ED] hover:bg-[#F5F5F9] hover:border-[#CBD5E1] transition-all flex items-center gap-2 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#718096]" />
            <span>Export Audit Log</span>
          </button>

          {isCritical ? (
            <button
              onClick={onResetSimulation}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#718096] bg-white border border-[#E1E5ED] hover:bg-[#F5F5F9] hover:text-[#172033] transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo</span>
            </button>
          ) : null}

          {/* Solid Red Simulation Button */}
          <button
            onClick={onRunSimulation}
            disabled={isSimulating}
            className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-[#C9362B] hover:bg-[#B92F26] active:bg-[#A82A22] disabled:bg-[#C9362B]/70 shadow-sm hover:shadow transition-all flex items-center gap-2"
          >
            {isSimulating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Simulating Cyber Attack...</span>
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

      {/* SIMULATION SUCCESS TOAST NOTIFICATION IF JUST TRIGGERED */}
      {simulationResult && (
        <div className="p-3.5 rounded-xl bg-[#FFF1F0] border border-[#FCA5A5] flex items-center justify-between gap-4 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 text-[#C9362B]">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <div>
              <span className="font-extrabold font-mono">
                {simulationResult.simulationId}: {simulationResult.incidentName}
              </span>
              <span className="mx-2 text-[#FCA5A5]">•</span>
              <span className="text-[#172033]">
                {simulationResult.message}
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate && onNavigate('/containment')}
            className="text-[11px] font-mono font-bold text-[#C9362B] hover:underline flex-shrink-0 flex items-center gap-1"
          >
            <span>Review Containment</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 6.2 FOUR SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: ACTIVE INCIDENTS */}
        <MetricCard
          title="Active Incidents"
          value={activeIncidentsCount}
          subvalue={isCritical ? "P1 CRITICAL" : "0 ELEVATED"}
          icon={ShieldAlert}
          variant={isCritical ? "danger" : "default"}
          badgeText={isCritical ? "CRITICAL DANGER" : "NOMINAL"}
          detailText={isCritical ? "APT-29 Exfiltration in Progress" : "All Sensors Nominal"}
        />

        {/* Card 2: MEAN TIME TO CONTAIN */}
        <MetricCard
          title="Mean Time To Contain"
          value={isCritical ? "1.8s" : "N/A"}
          subvalue={isCritical ? "Autonomous SLA" : "Baseline Standby"}
          icon={Clock}
          variant={isCritical ? "success" : "default"}
          badgeText="TARGET < 5.0s"
          detailText="Automated Zero-Trust Kill-Switch"
        />

        {/* Card 3: HOSTS IN DANGER */}
        <MetricCard
          title="Hosts in Danger"
          value={hostsInDangerCount}
          subvalue="AFFECTED ASSETS"
          icon={Server}
          variant={isCritical ? "danger" : "default"}
          badgeText={isCritical ? "3 ISOLATION CANDIDATES" : "0 ISOLATED"}
          detailText={isCritical ? "prod-db-replica-02, auth-srv, vault" : "Zero Infected Nodes"}
        />

        {/* Card 4: GLOBAL THREAT SCORE */}
        <MetricCard
          title="Global Threat Score"
          value={`${threatScore} / 100`}
          subvalue={isCritical ? "DANGER LEVEL 1" : "SECURITY HEALTH NOMINAL"}
          icon={Activity}
          variant={threatScore > 50 ? "danger" : "success"}
          badgeText={threatScore > 50 ? "ELEVATED THREAT" : "SECURE"}
          detailText="Real-time multi-agent telemetry rating"
        />
      </div>

      {/* 6.3 TOPOLOGY & COPILOT TWO-COLUMN AREA */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* LEFT COLUMN (8 cols): Autonomous Attack Propagation Topology */}
        <div className="xl:col-span-8">
          <AttackTopology
            incident={incident}
            events={events}
            onSelectHost={(host) => onNavigate && onNavigate('/containment')}
          />
        </div>

        {/* RIGHT COLUMN (4 cols): Sentinel AI Copilot */}
        <div className="xl:col-span-4">
          <SentinelCopilot
            history={voiceHistory}
            investigations={investigations}
            onAsk={onAskCopilot}
            isQuerying={isQueryingVoice}
          />
        </div>
      </div>

      {/* 6.4 LOWER OVERVIEW SECTION (THREE ALIGNED CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* LEFT: Live Threat Stream */}
        <LiveThreatStream
          events={events}
          onSelectEvent={() => onNavigate && onNavigate('/incidents')}
        />

        {/* CENTER: Attack Timeline */}
        <AttackTimeline
          events={events}
          onSelectEvent={() => onNavigate && onNavigate('/incidents')}
        />

        {/* RIGHT: Forensic Lockbox */}
        <ForensicLockbox
          evidence={evidence}
          onDownloadBundle={handleDownloadEvidenceBundle}
          onSelectArtifact={() => onNavigate && onNavigate('/forensics')}
        />
      </div>

      {/* 6.5 TELEMETRY & GUARD HEALTH PROBES (FULL WIDTH) */}
      <SourceHealthGrid sources={sources} />
    </div>
  );
}
