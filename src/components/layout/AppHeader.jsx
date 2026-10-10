import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Bell,
  Radio,
  RefreshCw
} from 'lucide-react';
import { ConnectionMode } from '../../api/client';

export function AppHeader({
  status,
  incident,
  eventsCount = 0,
  connectionMode,
  isMockData,
  onRefresh,
  onToggleMock,
  isRefreshing
}) {
  const [utcTime, setUtcTime] = useState('');

  // Live UTC SOC Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${hours}:${minutes}:${seconds} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isCriticalThreat = incident?.severity === 'CRITICAL' || (incident?.threatScore && incident.threatScore > 50);

  return (
    <header className="h-[78px] bg-white border-b border-[#E1E5ED] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-40 shadow-[0_1px_2px_rgba(23,32,51,0.02)]">
      {/* LEFT SECTION: BRANDING & SYSTEM INFO */}
      <div className="flex items-center gap-4">
        {/* Shield Icon Box */}
        <div className="w-11 h-11 rounded-xl bg-[#FFF1F0] border border-[#FCE7E6] flex items-center justify-center text-[#C9362B] shadow-sm flex-shrink-0">
          <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
        </div>

        {/* Brand Text */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-tight text-[#172033] font-sans">
              AEGIS<span className="text-[#C9362B]">X</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-[#718096] bg-[#F5F5F9] px-2 py-0.5 rounded border border-[#E1E5ED]">
              SENTINEL SOC
            </span>
          </div>
          <span className="text-[11px] font-medium text-[#8995AA] tracking-wide">
            v2.4 Enterprise Incident Defense
          </span>
        </div>

        {/* Vertical Separator */}
        <div className="hidden md:block h-8 w-[1px] bg-[#E1E5ED] mx-1" />

        {/* SOC Subtitle */}
        <div className="hidden lg:flex flex-col">
          <span className="text-xs font-semibold text-[#172033] tracking-tight">
            Agentic Cyber Defense Command
          </span>
          <span className="text-[11px] text-[#718096] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F9D60] animate-pulse" />
            Autonomous First Responder • Active Monitoring
          </span>
        </div>
      </div>

      {/* RIGHT SECTION: DANGER BADGE, CLOCK, NOTIFICATIONS, CONNECTION STATUS & PROFILE */}
      <div className="flex items-center gap-3">
        {/* Live Danger Alert Badge */}
        {isCriticalThreat ? (
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#FFF1F0] border border-[#FCA5A5] text-[#C9362B] shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C9362B] animate-danger-pulse" />
            <div className="flex flex-col">
              <span className="text-[11px] font-extrabold tracking-wider font-mono uppercase leading-tight">
                LIVE DANGER ALERT
              </span>
              <span className="text-[9px] font-mono text-[#B92F26] leading-none">
                THREAT LEVEL 1 // CRITICAL
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534]">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold tracking-wider font-mono uppercase leading-tight">
                SYSTEM NOMINAL
              </span>
              <span className="text-[9px] font-mono text-[#15803D] leading-none">
                STANDBY // LOW RISK
              </span>
            </div>
          </div>
        )}

        {/* UTC Clock in Monospace */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F5F9] border border-[#E1E5ED] rounded-lg text-[#172033] font-mono text-xs font-semibold">
          <Radio className="w-3.5 h-3.5 text-[#718096]" />
          <span>{utcTime || '--:--:-- UTC'}</span>
        </div>

        {/* Backend Connection Indicator */}
        <div
          onClick={onToggleMock}
          title="Click to toggle between Live FastAPI Backend and Mock Demo Rig"
          className="flex items-center gap-2 px-2.5 py-1.5 bg-[#F5F5F9] hover:bg-[#ECEEF5] border border-[#E1E5ED] rounded-lg cursor-pointer transition-colors"
        >
          {connectionMode === ConnectionMode.CONNECTED ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#4F9D60] animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-[#172033]">
                CONNECTED
              </span>
            </>
          ) : connectionMode === ConnectionMode.DISCONNECTED ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#C9362B]" />
              <span className="text-[11px] font-mono font-bold text-[#C9362B]">
                DISCONNECTED
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-[#D97706]" />
              <span className="text-[11px] font-mono font-bold text-[#D97706]">
                DEMO RIG
              </span>
            </>
          )}

          {isMockData && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-bold">
              MOCK DATA
            </span>
          )}
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh SOC Telemetry"
          className="w-9 h-9 rounded-lg border border-[#E1E5ED] bg-white hover:bg-[#F5F5F9] flex items-center justify-center text-[#718096] hover:text-[#172033] transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#C9362B]' : ''}`} />
        </button>

        {/* Notification Bell with Event Count */}
        <div className="relative">
          <button
            title="Active Security Alerts"
            className="w-9 h-9 rounded-lg border border-[#E1E5ED] bg-white hover:bg-[#F5F5F9] flex items-center justify-center text-[#718096] hover:text-[#172033] transition-colors"
          >
            <Bell className="w-4 h-4" />
            {eventsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C9362B] text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-sm">
                {eventsCount}
              </span>
            )}
          </button>
        </div>

        {/* Separator */}
        <div className="h-7 w-[1px] bg-[#E1E5ED] mx-0.5" />

        {/* Administrator Profile Control */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-lg bg-[#172033] text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-sm">
            SA
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-bold text-[#172033] leading-tight">
              Lead SOC Analyst
            </span>
            <span className="text-[10px] font-mono text-[#8995AA] leading-none">
              DEMO ADMIN
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
