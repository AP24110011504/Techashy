import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function EmptyState({ title = 'No Active Records', message = 'System operating nominal. No anomalies detected.', icon: Icon = ShieldCheck }) {
  return (
    <div className="soc-surface p-6 rounded border border-border/80 text-center flex flex-col items-center justify-center my-2">
      <div className="p-3 rounded-full bg-background border border-border text-text-secondary mb-2.5">
        <Icon className="w-5 h-5 text-accent" />
      </div>
      <h4 className="text-sm font-semibold text-text-primary mb-1">
        {title}
      </h4>
      <p className="text-xs text-text-secondary max-w-sm">
        {message}
      </p>
    </div>
  );
}
