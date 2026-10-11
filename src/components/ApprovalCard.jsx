import React, { useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { ShieldCheck, CheckCircle, XCircle, Zap, Check, AlertTriangle } from 'lucide-react';

export function ApprovalCard({ action, onApprove, isApproving }) {
  const [analystNote, setAnalystNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  if (!action) return null;

  const isPending = action.status === 'PENDING';
  const isExecuted = action.status === 'EXECUTED';
  const isRejected = action.status === 'REJECTED';

  const handleApprove = () => {
    onApprove('APPROVED', analystNote || 'Approved containment action under SOC SOP-402');
  };

  const handleReject = () => {
    onApprove('REJECTED', analystNote || 'Rejected action by SOC supervisor');
  };

  return (
    <div className="soc-surface p-4 rounded border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-card border border-border">
            <Zap className="w-4 h-4 text-accent" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-text-secondary uppercase">
              Action ID: {action.actionId}
            </span>
            <h3 className="text-sm font-semibold text-text-primary">
              {action.actionName}
            </h3>
          </div>
        </div>

        <StatusBadge status={action.status} size="sm" />
      </div>

      {/* Metrics: Risk Reduction & Potential Impact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div className="p-3 rounded bg-card border border-border flex items-start gap-2.5">
          <div className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-text-secondary block">
              Risk Reduction
            </span>
            <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {action.riskReduction || '85%'}
            </span>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Lateral spread & bulk data egress blocked
            </p>
          </div>
        </div>

        <div className="p-3 rounded bg-card border border-border flex items-start gap-2.5">
          <div className="p-1.5 rounded bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-text-secondary block">
              Operational Impact
            </span>
            <p className="text-xs text-text-primary mt-0.5 leading-snug">
              {action.potentialImpact || 'Read traffic automatically reroutes to backup cluster.'}
            </p>
          </div>
        </div>
      </div>

      {/* Execution Outcome if completed */}
      {isExecuted && (
        <div className="p-3 rounded bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 mb-3 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-mono font-semibold mb-1">
            <CheckCircle className="w-4 h-4" />
            <span>Execution Outcome Verified</span>
            {action.executedAt && (
              <span className="text-[10px] text-text-secondary ml-auto">
                {new Date(action.executedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
          <p className="text-text-primary font-mono text-xs">
            {action.outcome}
          </p>
          {action.analystNote && (
            <p className="text-[11px] text-text-secondary mt-1 italic">
              Note: {action.analystNote}
            </p>
          )}
        </div>
      )}

      {/* Rejection notice */}
      {isRejected && (
        <div className="p-3 rounded bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 mb-3 text-xs text-rose-700 dark:text-rose-300">
          <div className="flex items-center gap-1.5 font-semibold mb-1">
            <XCircle className="w-4 h-4" />
            <span>Containment Decision: Rejected</span>
          </div>
          <p className="text-xs text-text-secondary font-mono">
            {action.analystNote || 'Action was rejected by human operator.'}
          </p>
        </div>
      )}

      {/* Interactive Human Approval Controls */}
      {isPending && (
        <div className="space-y-2.5 pt-1">
          {showNoteInput && (
            <input
              type="text"
              value={analystNote}
              onChange={(e) => setAnalystNote(e.target.value)}
              placeholder="Add optional analyst authorization note or ticket ref..."
              className="w-full bg-card border border-border px-3 py-1.5 text-xs rounded text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
            />
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setShowNoteInput(!showNoteInput)}
              className="text-[11px] text-text-secondary hover:text-text-primary font-mono underline"
            >
              {showNoteInput ? 'Hide note field' : '+ Add Analyst Authorization Note'}
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                disabled={isApproving}
                onClick={handleReject}
                className="px-3 py-1.5 rounded border border-border bg-card hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-300 hover:text-rose-600 text-xs font-mono text-text-secondary transition-all disabled:opacity-50"
              >
                Reject Action
              </button>

              <button
                type="button"
                disabled={isApproving}
                onClick={handleApprove}
                className="px-4 py-1.5 rounded bg-accent text-white hover:bg-accent-hover font-mono text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
              >
                {isApproving ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Enforcing Quarantine...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Authorize & Execute Containment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
