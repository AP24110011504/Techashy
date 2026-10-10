import React from 'react';
import { Play, RotateCcw, CheckCircle, Zap } from 'lucide-react';

export function MainActionBanner({ onRunSimulation, onResetSimulation, isSimulating, simulationResult, hasSimulated }) {
  return (
    <div className="soc-card p-3.5 mb-4 border border-border">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2 rounded bg-surface border border-border text-accent hidden xs:block">
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-text-primary tracking-tight">
                Simulated Attack Orchestration
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-text-secondary">
                Scenario: APT-29 DB Breach
              </span>
            </div>
            <p className="text-xs text-text-secondary font-mono mt-0.5">
              Injects live attack telemetry across IAM, EDR, Firewall, Host, and Database sensors
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {hasSimulated && (
            <button
              type="button"
              onClick={onResetSimulation}
              disabled={isSimulating}
              className="px-3 py-2 rounded bg-surface border border-border hover:border-text-secondary text-xs font-mono text-text-secondary hover:text-text-primary transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Baseline
            </button>
          )}

          <button
            type="button"
            onClick={onRunSimulation}
            disabled={isSimulating}
            className="w-full sm:w-auto px-5 py-2.5 rounded bg-accent text-white hover:bg-accent-hover font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 tracking-wide"
          >
            {isSimulating ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Injecting Attack Scenario Telemetry...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Attack Simulation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result State Callout */}
      {simulationResult && (
        <div className="mt-3 pt-2.5 border-t border-border/60 flex items-start sm:items-center justify-between gap-2 text-xs font-mono bg-surface p-2.5 rounded border border-border">
          <div className="flex items-center gap-2 text-text-primary">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{simulationResult.message}</span>
          </div>
          <span className="text-[11px] text-text-secondary flex-shrink-0">
            Sim ID: {simulationResult.simulationId}
          </span>
        </div>
      )}
    </div>
  );
}
