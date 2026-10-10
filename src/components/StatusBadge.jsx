import React from 'react';

const BADGE_CONFIG = {
  // Source states
  VERIFIED: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-500/30',
    dot: 'bg-emerald-500 dark:bg-emerald-400'
  },
  DEGRADED: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-800 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-500/30',
    dot: 'bg-amber-500 dark:bg-amber-400'
  },
  COMPROMISED: {
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-500/30',
    dot: 'bg-rose-500 dark:bg-rose-400'
  },
  OFFLINE: {
    bg: 'bg-slate-100 dark:bg-slate-500/10',
    text: 'text-slate-700 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-500/30',
    dot: 'bg-slate-500 dark:bg-slate-400'
  },

  // Severity levels
  CRITICAL: {
    bg: 'bg-rose-50 dark:bg-rose-500/15',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-500/35',
    dot: 'bg-rose-500'
  },
  HIGH: {
    bg: 'bg-amber-50 dark:bg-amber-500/15',
    text: 'text-amber-800 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-500/35',
    dot: 'bg-amber-500'
  },
  MEDIUM: {
    bg: 'bg-sky-50 dark:bg-sky-500/15',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-500/30',
    dot: 'bg-sky-500 dark:bg-sky-400'
  },
  LOW: {
    bg: 'bg-slate-100 dark:bg-slate-500/15',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-500/30',
    dot: 'bg-slate-500 dark:bg-slate-400'
  },

  // Action / Evidence statuses
  VALID: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-500/30',
    dot: 'bg-emerald-500 dark:bg-emerald-400'
  },
  UNALTERED: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-500/30',
    dot: 'bg-emerald-500 dark:bg-emerald-400'
  },
  PENDING: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-500/30',
    dot: 'bg-amber-500 dark:bg-amber-400'
  },
  APPROVED: {
    bg: 'bg-sky-50 dark:bg-sky-500/10',
    text: 'text-sky-700 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-500/30',
    dot: 'bg-sky-500 dark:bg-sky-400'
  },
  EXECUTED: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/15',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-500/40',
    dot: 'bg-emerald-500 dark:bg-emerald-400'
  },
  REJECTED: {
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-500/30',
    dot: 'bg-rose-500 dark:bg-rose-400'
  },

  // Connection states
  CONNECTED: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-500/30',
    dot: 'bg-emerald-500 dark:bg-emerald-400 animate-pulse'
  },
  DISCONNECTED: {
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-500/30',
    dot: 'bg-rose-500 dark:bg-rose-400'
  },
  MOCK_MODE: {
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-500/30',
    dot: 'bg-purple-500 dark:bg-purple-400'
  }
};

export function StatusBadge({ status, label, showDot = true, size = 'sm' }) {
  const normalizedKey = (status || '').toUpperCase();
  const config = BADGE_CONFIG[normalizedKey] || {
    bg: 'bg-slate-100 dark:bg-slate-500/10',
    text: 'text-slate-700 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-500/30',
    dot: 'bg-slate-500 dark:bg-slate-400'
  };

  const displayText = label || status || 'UNKNOWN';

  const sizeClass = size === 'xs'
    ? 'text-[10px] px-1.5 py-0.5 tracking-wider'
    : 'text-xs px-2.5 py-1 tracking-wide';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium font-mono uppercase rounded border ${config.bg} ${config.text} ${config.border} ${sizeClass}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      )}
      <span>{displayText}</span>
    </span>
  );
}
