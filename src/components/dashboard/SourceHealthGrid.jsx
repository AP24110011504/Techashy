import React from 'react';
import { Activity, ShieldCheck, Wifi, Server, Database, Lock } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export function SourceHealthGrid({ sources = [] }) {
  const getSourceIcon = (category = '', name = '') => {
    const term = (category + ' ' + name).toLowerCase();
    if (term.includes('iam') || term.includes('identity')) return Lock;
    if (term.includes('edr') || term.includes('endpoint')) return ShieldCheck;
    if (term.includes('firewall') || term.includes('network')) return Wifi;
    if (term.includes('server') || term.includes('host') || term.includes('compute')) return Server;
    if (term.includes('database') || term.includes('sql')) return Database;
    return Activity;
  };

  return (
    <div className="soc-card p-5 bg-white">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#E1E5ED]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FFF1F0] text-[#C9362B] border border-[#FCA5A5] flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172033] tracking-tight">
              Telemetry & Guard Health Probes
            </h3>
            <p className="text-[11px] font-mono text-[#718096]">
              Real-time trust metrics across heterogeneous enterprise telemetry layers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#718096]">
          <span className="w-2 h-2 rounded-full bg-[#4F9D60] animate-pulse" />
          <span>{sources.length} Ingest Channels Operational</span>
        </div>
      </div>

      {/* SUBCARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {sources.map((src) => {
          const Icon = getSourceIcon(src.category, src.name);
          const isCompromised = src.status === 'COMPROMISED';
          const isDegraded = src.status === 'DEGRADED';

          return (
            <div
              key={src.id || src.name}
              className={`p-3.5 rounded-xl border transition-all duration-150 ${
                isCompromised
                  ? 'bg-gradient-to-b from-white to-[#FFF1F0]/40 border-[#FCA5A5]'
                  : isDegraded
                  ? 'bg-gradient-to-b from-white to-[#FFFBEB]/40 border-[#FDE68A]'
                  : 'bg-[#F5F5F9] border-[#E1E5ED] hover:bg-white hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isCompromised
                      ? 'bg-[#FFF1F0] text-[#C9362B]'
                      : isDegraded
                      ? 'bg-[#FEF3C7] text-[#92400E]'
                      : 'bg-white text-[#4F9D60] border border-[#E1E5ED]'
                  }`}>
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#172033] leading-tight">
                      {src.name}
                    </h4>
                    <span className="text-[10px] font-mono text-[#8995AA]">
                      {src.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <StatusBadge status={src.status} />
                <span className={`text-[11px] font-mono font-extrabold ${
                  src.trustScore >= 80
                    ? 'text-[#4F9D60]'
                    : src.trustScore >= 50
                    ? 'text-[#D97706]'
                    : 'text-[#C9362B]'
                }`}>
                  {src.trustScore}% Trust
                </span>
              </div>

              <div className="space-y-1 text-[10px] font-mono text-[#718096] pt-2 border-t border-[#E1E5ED]/80">
                <div className="flex items-center justify-between">
                  <span>Rate:</span>
                  <span className="font-semibold text-[#172033]">
                    {src.telemetryRate || 'Nominal'}
                  </span>
                </div>
                {src.summary && (
                  <p className="text-[11px] text-[#718096] font-sans line-clamp-2 pt-1 border-t border-[#E1E5ED]/50">
                    {src.summary}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
