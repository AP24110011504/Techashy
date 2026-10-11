import React from 'react';
import { StatusBadge } from './StatusBadge';
import { getThreatScoreColor } from '../utils/formatters';
import { Server, Activity, ShieldAlert } from 'lucide-react';

export function IncidentSummaryCard({ incident }) {
  if (!incident) return null;

  const threatColor = getThreatScoreColor(incident.threatScore || 0);

  return (
    <div className="soc-card p-4 border border-border">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-surface border border-border mt-0.5">
            <ShieldAlert className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-text-secondary">
                {incident.incidentId || 'INC-ACTIVE'}
              </span>
              <StatusBadge status={incident.severity} size="xs" />
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface border border-border text-text-secondary">
                Phase: <strong className="text-text-primary uppercase">{incident.phase}</strong>
              </span>
            </div>
            <h2 className="text-base font-semibold text-text-primary mt-1">
              {incident.incidentName}
            </h2>
          </div>
        </div>

        {/* Threat Score Metric */}
        <div className="flex items-center gap-4 bg-surface/60 px-3.5 py-2 rounded border border-border self-start md:self-auto">
          <div>
            <span className="text-[10px] uppercase font-mono text-text-secondary block">
              Threat Score
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono tracking-tight text-text-primary">
                {incident.threatScore}
              </span>
              <span className="text-xs text-text-secondary font-mono">/100</span>
            </div>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-mono font-semibold border ${threatColor}`}>
            {incident.threatScore >= 75 ? 'HIGH RISK' : incident.threatScore >= 40 ? 'ELEVATED' : 'NOMINAL'}
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 text-xs">
        <div>
          <span className="text-text-secondary block font-mono text-[11px] mb-1">
            Detection Status:
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-text-primary bg-surface px-2 py-1 rounded border border-border">
            <Activity className="w-3.5 h-3.5 text-accent" />
            {incident.detectionStatus}
          </span>
        </div>

        <div className="sm:col-span-1 lg:col-span-2">
          <span className="text-text-secondary block font-mono text-[11px] mb-1">
            Affected Infrastructure & Assets:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {incident.affectedAssets && incident.affectedAssets.length > 0 ? (
              incident.affectedAssets.map((asset, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-text-primary bg-surface px-2 py-0.5 rounded border border-border"
                >
                  <Server className="w-3 h-3 text-text-secondary" />
                  {asset}
                </span>
              ))
            ) : (
              <span className="text-text-secondary">No assets impacted</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
