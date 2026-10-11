import React, { useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { Shield, Radio, RefreshCw, Sun, Moon } from 'lucide-react';

export function Header({ status: _status, connectionMode, isMockData, onRefresh, onToggleMock, isRefreshing }) {
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  return (
    <header className="soc-card p-4 mb-4 border border-border">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-surface border border-border flex items-center justify-center text-accent shadow-sm">
            <Shield className="w-6 h-6 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-text-primary">
                AEGISX Sentinel
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border text-text-secondary uppercase">
                v1.4.0-SOC
              </span>
            </div>
            <p className="text-xs text-text-secondary font-mono tracking-tight">
              Real-Time Cybersecurity First Responder // Autonomous Incident Command
            </p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Connection Status Badge */}
          <div className="flex items-center gap-1.5 bg-surface px-2.5 py-1.5 rounded border border-border">
            <Radio className={`w-3.5 h-3.5 ${connectionMode === 'CONNECTED' ? 'text-emerald-500 animate-pulse' : 'text-purple-500'}`} />
            <span className="text-[11px] font-mono text-text-secondary uppercase">Link:</span>
            <StatusBadge status={connectionMode} size="xs" label={connectionMode === 'MOCK_MODE' ? 'MOCK MODE' : connectionMode} />
          </div>

          {/* Visible MOCK DATA Indicator if in Mock Mode */}
          {isMockData && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 font-mono text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400 animate-ping inline-block" />
              <span>MOCK DATA ACTIVE</span>
            </div>
          )}

          {/* Mode Switch Toggle Button for evaluators */}
          <button
            type="button"
            onClick={onToggleMock}
            title="Toggle between Live API connection and Local Mock Mode adapter"
            className="px-2.5 py-1.5 text-xs font-mono rounded bg-surface border border-border hover:border-accent text-text-secondary hover:text-text-primary transition-colors"
          >
            Switch to {connectionMode === 'MOCK_MODE' ? 'Live API' : 'Mock Mode'}
          </button>

          {/* Theme Toggle (Light / Dark) */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
            className="p-1.5 rounded bg-surface border border-border hover:border-accent text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1 text-xs font-mono"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Sync / Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh real-time telemetry from backend"
            className="p-1.5 rounded bg-surface border border-border hover:border-accent text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
