import React from 'react';
import { Bot, AlertCircle, ArrowRight, Link } from 'lucide-react';

const AGENT_COLORS = {
  'Identity Sentinel Agent': 'text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10',
  'Network Recon Agent': 'text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10',
  'Forensics & Integrity Agent': 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10'
};

export function InvestigationCard({ finding }) {
  const agentColor = AGENT_COLORS[finding.agentName] || 'text-accent border-accent/30 bg-accent/10';
  const confidencePercent = Math.round((finding.confidence || 0) * 100);

  return (
    <div className="soc-surface p-3.5 rounded border border-border mb-3 hover:border-border/90 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-card border border-border">
            <Bot className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h4 className={`text-xs font-semibold font-mono px-2 py-0.5 rounded border ${agentColor}`}>
              {finding.agentName}
            </h4>
          </div>
        </div>

        {/* Confidence metric */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase text-text-secondary">Confidence</span>
          <div className="flex items-center gap-1.5 font-mono text-xs px-2 py-0.5 rounded bg-card border border-border">
            <div className="w-12 h-1.5 bg-surface rounded-full overflow-hidden border border-border/60">
              <div
                className="h-full bg-accent rounded-full"
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
            <span className="font-semibold text-accent">{confidencePercent}%</span>
          </div>
        </div>
      </div>

      {/* Main Finding */}
      <p className="text-sm text-text-primary leading-relaxed mb-3">
        {finding.finding}
      </p>

      {/* Supporting Event IDs */}
      {finding.supportingEventIds && finding.supportingEventIds.length > 0 && (
        <div className="flex items-center gap-1.5 mb-2.5 flex-wrap text-xs font-mono">
          <span className="text-text-secondary text-[11px] flex items-center gap-1">
            <Link className="w-3 h-3 text-text-secondary" />
            Supporting Evidence:
          </span>
          {finding.supportingEventIds.map((evtId, idx) => (
            <span
              key={idx}
              className="px-1.5 py-0.5 rounded bg-card border border-border text-accent text-[11px]"
            >
              {evtId}
            </span>
          ))}
        </div>
      )}

      {/* Uncertainty Notes */}
      {finding.uncertaintyNotes && (
        <div className="p-2 rounded bg-amber-50/70 dark:bg-background/70 border border-amber-200 dark:border-border/60 mb-2.5 flex items-start gap-2 text-xs">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-mono text-text-secondary block">
              Uncertainty & Forensic Caveats:
            </span>
            <p className="text-text-secondary text-xs mt-0.5">
              {finding.uncertaintyNotes}
            </p>
          </div>
        </div>
      )}

      {/* Recommendation */}
      {finding.recommendation && (
        <div className="p-2.5 rounded bg-blue-50/70 dark:bg-accent/5 border border-blue-200 dark:border-accent/20 flex items-start gap-2 text-xs">
          <ArrowRight className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-mono text-accent block font-semibold">
              Action Recommendation:
            </span>
            <p className="text-text-primary font-medium mt-0.5">
              {finding.recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
