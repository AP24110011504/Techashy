import React from 'react';
import {
  ShieldAlert,
  Clock,
  Server,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export function MetricCard({
  title,
  value,
  subvalue,
  icon: Icon,
  variant = 'default',
  badgeText,
  detailText,
  sparklineData
}) {
  const isDanger = variant === 'danger' || variant === 'critical';
  const isSuccess = variant === 'success';

  return (
    <div className={`soc-card p-5 transition-all duration-200 hover:shadow-md ${
      isDanger ? 'border-[#FCA5A5] bg-gradient-to-b from-white to-[#FFF5F5]/30' : 'bg-white'
    }`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#718096]">
            {title}
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className={`text-3xl font-extrabold tracking-tight font-sans ${
              isDanger ? 'text-[#C9362B]' : isSuccess ? 'text-[#4F9D60]' : 'text-[#172033]'
            }`}>
              {value}
            </span>
            {subvalue && (
              <span className="text-xs font-mono font-semibold text-[#8995AA]">
                {subvalue}
              </span>
            )}
          </div>
        </div>

        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isDanger
            ? 'bg-[#FFF1F0] text-[#C9362B] border border-[#FCA5A5]'
            : isSuccess
            ? 'bg-[#F0FDF4] text-[#4F9D60] border border-[#BBF7D0]'
            : 'bg-[#F5F5F9] text-[#718096] border border-[#E1E5ED]'
        }`}>
          {Icon && <Icon className="w-5 h-5 stroke-[2.2]" />}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#E1E5ED]/70 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium text-[#718096] truncate">
          {isDanger ? (
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9362B] animate-pulse" />
          ) : isSuccess ? (
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F9D60]" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-[#8995AA]" />
          )}
          <span className="truncate">{detailText || 'Telemetry live'}</span>
        </div>

        {badgeText && (
          <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
            isDanger
              ? 'bg-[#FFF1F0] text-[#C9362B] border border-[#FCA5A5]'
              : isSuccess
              ? 'bg-[#F0FDF4] text-[#4F9D60] border border-[#BBF7D0]'
              : 'bg-[#F5F5F9] text-[#718096] border border-[#E1E5ED]'
          }`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}
