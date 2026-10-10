import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Synchronizing real-time telemetry...' }) {
  return (
    <div className="soc-surface p-8 rounded border border-border flex flex-col items-center justify-center my-4">
      <Loader2 className="w-6 h-6 text-accent animate-spin mb-2" />
      <span className="text-xs font-mono text-text-secondary tracking-wide">
        {message}
      </span>
    </div>
  );
}
