import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function ErrorState({ error, onRetry }) {
  return (
    <div className="soc-surface p-4 rounded border border-rose-500/30 bg-rose-500/5 my-2 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-rose-300">
          Telemetry Error
        </h4>
        <p className="text-xs text-text-secondary mt-0.5 font-mono">
          {error || 'Unable to communicate with the AEGISX telemetry endpoint.'}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-2.5 py-1 text-xs font-mono rounded bg-background border border-border text-text-primary hover:border-accent flex items-center gap-1 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      )}
    </div>
  );
}
