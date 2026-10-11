import React from 'react';
import { StatusBadge } from './StatusBadge';
import { getTrustScoreColor } from '../utils/formatters';
import { Shield, KeyRound, Server, Database, Flame } from 'lucide-react';

const SOURCE_ICONS = {
  IAM: KeyRound,
  EDR: Shield,
  Firewall: Flame,
  Server: Server,
  Database: Database
};

export function SourceCard({ source }) {
  const IconComponent = SOURCE_ICONS[source.name] || Shield;
  const trustColor = getTrustScoreColor(source.trustScore);

  return (
    <div className="soc-card p-3.5 hover:border-border/80 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-surface border border-border text-text-secondary">
              <IconComponent className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary tracking-tight">
                {source.name}
              </h3>
              <p className="text-[11px] text-text-secondary font-mono">
                {source.category || 'Telemetry Source'}
              </p>
            </div>
          </div>
          <StatusBadge status={source.status} size="xs" />
        </div>

        {source.summary && (
          <p className="text-xs text-text-secondary line-clamp-2 my-2 leading-relaxed">
            {source.summary}
          </p>
        )}
      </div>

      <div className="pt-2 mt-1 border-t border-border/50 flex items-center justify-between text-xs font-mono">
        <div>
          <span className="text-[10px] text-text-secondary block uppercase">Trust Score</span>
          <span className={`font-semibold ${trustColor}`}>
            {source.trustScore != null ? `${source.trustScore}%` : 'N/A'}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-text-secondary block uppercase">Last Sync</span>
          <span className="text-text-secondary text-[11px]">
            {source.lastUpdated ? new Date(source.lastUpdated).toLocaleTimeString() : 'Recent'}
          </span>
        </div>
      </div>
    </div>
  );
}
