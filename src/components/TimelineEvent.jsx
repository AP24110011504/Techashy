import React, { useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { truncateHash, formatSocTimestamp } from '../utils/formatters';
import { Copy, Check, Hash, Clock, Server } from 'lucide-react';

export function TimelineEvent({ event, isLast = false }) {
  const [copied, setCopied] = useState(false);

  const copyHash = () => {
    if (event.rawHash) {
      navigator.clipboard.writeText(event.rawHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="relative flex items-start gap-3 group">
      {/* Vertical Timeline connector */}
      <div className="flex flex-col items-center self-stretch">
        <div className="w-2.5 h-2.5 rounded-full bg-accent border-2 border-card ring-2 ring-border z-10 mt-1.5" />
        {!isLast && (
          <div className="w-px bg-border flex-grow my-1 group-hover:bg-accent/40 transition-colors" />
        )}
      </div>

      {/* Event Details Card */}
      <div className="flex-1 soc-surface p-3 rounded border border-border mb-3 hover:border-border/90 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-accent px-1.5 py-0.5 rounded bg-card border border-border">
              {event.id}
            </span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-card border border-border text-text-primary">
              {event.source}
            </span>
            <StatusBadge status={event.severity} size="xs" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-text-secondary flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {event.relativeTime || formatSocTimestamp(event.timestamp)}
            </span>
            <StatusBadge status={event.evidenceStatus} size="xs" label={event.evidenceStatus} />
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-text-primary font-normal leading-relaxed my-1">
          {event.description}
        </p>

        {/* Cryptographic hash & Asset context */}
        <div className="mt-2 pt-1.5 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-text-secondary">
          <div className="flex items-center gap-1.5">
            <Server className="w-3 h-3 text-text-secondary" />
            <span className="text-text-primary">{event.assetId || 'host-cluster'}</span>
          </div>

          {event.rawHash && (
            <div className="flex items-center gap-1.5 bg-card px-2 py-0.5 rounded border border-border">
              <Hash className="w-3 h-3 text-text-secondary" />
              <span className="text-[11px] text-text-secondary font-mono">
                {truncateHash(event.rawHash, 6, 6)}
              </span>
              <button
                type="button"
                onClick={copyHash}
                title="Copy raw SHA-256 hash"
                className="hover:text-text-primary transition-colors ml-0.5"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
