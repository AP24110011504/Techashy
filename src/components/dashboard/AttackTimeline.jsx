import React from 'react';
import { Clock, ShieldAlert, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatSocTimestamp, truncateHash } from '../../utils/formatters';

export function AttackTimeline({ events = [], onSelectEvent }) {
  // Sort chronologically ascending
  const sortedEvents = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return (
    <div className="soc-card p-5 flex flex-col h-full bg-white">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E1E5ED]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FFF1F0] text-[#C9362B] border border-[#FCA5A5] flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
              Attack Timeline
            </h3>
            <span className="text-[10px] font-mono text-[#718096]">
              Chronological kill-chain stage progression
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F5F5F9] border border-[#E1E5ED] text-[#718096] font-bold">
          {sortedEvents.length} Stages
        </span>
      </div>

      {/* TIMELINE LIST */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[360px]">
        {sortedEvents && sortedEvents.length > 0 ? (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#E1E5ED]">
            {sortedEvents.map((evt, idx) => {
              const isCritical = evt.severity === 'CRITICAL';

              return (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent && onSelectEvent(evt)}
                  className="relative group cursor-pointer"
                >
                  {/* Timeline Stage Dot */}
                  <div className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 bg-white transition-all duration-150 ${
                    isCritical
                      ? 'border-[#C9362B] group-hover:scale-125 group-hover:bg-[#C9362B]'
                      : 'border-[#D97706] group-hover:scale-125 group-hover:bg-[#D97706]'
                  }`} />

                  {/* Stage Card */}
                  <div className="p-3 rounded-xl bg-[#F5F5F9] hover:bg-[#FFF1F0]/40 border border-[#E1E5ED] hover:border-[#FCA5A5] transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-[#8995AA]">
                        {formatSocTimestamp(evt.timestamp)}
                      </span>
                      <StatusBadge status={evt.severity} />
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[#172033] group-hover:text-[#C9362B] transition-colors">
                        {evt.id} // {evt.source}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white border border-[#E1E5ED] text-[#4F9D60] font-bold">
                        {evt.evidenceStatus}
                      </span>
                    </div>

                    <p className="text-xs text-[#172033] font-medium leading-relaxed">
                      {evt.description}
                    </p>

                    {evt.rawHash && (
                      <div className="mt-2 pt-2 border-t border-[#E1E5ED]/70 flex items-center justify-between text-[10px] font-mono text-[#8995AA]">
                        <span>Hash: {truncateHash(evt.rawHash, 6, 6)}</span>
                        <span>Target: {evt.assetId}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-[#8995AA] space-y-1">
            <p className="font-semibold text-[#172033]">Attack Timeline Nominal</p>
            <p>No attack chain events logged.</p>
          </div>
        )}
      </div>
    </div>
  );
}
