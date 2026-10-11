import React from 'react';
import { Radio, AlertCircle, ShieldAlert, Clock, ArrowUpRight } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatSocTimestamp } from '../../utils/formatters';

export function LiveThreatStream({ events = [], onSelectEvent }) {
  return (
    <div className="soc-card p-5 flex flex-col h-full bg-white">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E1E5ED]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FFF1F0] text-[#C9362B] border border-[#FCA5A5] flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
              Live Threat Stream
            </h3>
            <span className="text-[10px] font-mono text-[#718096]">
              Real-time multi-sensor telemetry ingest
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F5F5F9] border border-[#E1E5ED] text-[#718096] font-bold">
          {events.length} Events
        </span>
      </div>

      {/* EVENT LIST */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[360px]">
        {events && events.length > 0 ? (
          events.map((evt) => (
            <div
              key={evt.id}
              onClick={() => onSelectEvent && onSelectEvent(evt)}
              className="p-3 rounded-xl bg-[#F5F5F9] hover:bg-[#FFF1F0]/40 border border-[#E1E5ED] hover:border-[#FCA5A5] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#172033] group-hover:text-[#C9362B] transition-colors">
                    {evt.id}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white border border-[#E1E5ED] text-[#718096]">
                    {evt.source}
                  </span>
                </div>
                <StatusBadge status={evt.severity} />
              </div>

              <p className="text-xs text-[#172033] font-medium line-clamp-2 leading-relaxed">
                {evt.description}
              </p>

              <div className="mt-2 pt-2 border-t border-[#E1E5ED]/70 flex items-center justify-between text-[10px] font-mono text-[#718096]">
                <span className="truncate max-w-[140px] text-[#8995AA]">
                  Host: {evt.assetId || 'N/A'}
                </span>
                <span className="text-[#718096]">
                  {evt.relativeTime || formatSocTimestamp(evt.timestamp)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-xs text-[#8995AA] space-y-1">
            <p className="font-semibold text-[#172033]">Threat Stream Idle</p>
            <p>Run a threat simulation to inject multi-vector attack events.</p>
          </div>
        )}
      </div>
    </div>
  );
}
