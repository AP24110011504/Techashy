
import React, { useMemo, useState } from 'react';
import {
  Network,
  Server,
  Monitor,
  Database,
  Shield,
  Radio,
  Info,
  X,
} from 'lucide-react';

export function AttackTopology({ incident, events = [], onSelectHost }) {
  const [selectedNode, setSelectedNode] = useState(null);

  const nodes = useMemo(() => {
    const actualEvents = Array.isArray(events) ? events : [];
    const byId = new Map();

    actualEvents.forEach((event) => {
      const severity = String(event.severity || '').toUpperCase();
      const status =
        severity === 'CRITICAL' || severity === 'HIGH'
          ? 'SUSPICIOUS'
          : 'OBSERVED';

      if (event.host) {
        const id = `host:${event.host}`;
        if (!byId.has(id)) {
          byId.set(id, {
            id,
            name: event.host,
            ip: event.source_ip || 'IP not supplied',
            type: 'host',
            status,
            details: event.description || 'Host named in returned event telemetry.',
          });
        }
      }

      [event.source_ip, event.destination_ip].filter(Boolean).forEach((ip) => {
        const id = `ip:${ip}`;
        if (!byId.has(id)) {
          byId.set(id, {
            id,
            name: ip,
            ip,
            type: 'ip',
            status,
            details: event.description || 'IP address named in returned event telemetry.',
          });
        }
      });
    });

    return Array.from(byId.values()).map((node, index, all) => ({
      ...node,
      x: ((index + 1) / (all.length + 1)) * 100,
      y: 50,
    }));
  }, [events]);

  const statusStyle = (status) => {
    if (status === 'SUSPICIOUS') {
      return {
        border: '#F59E0B',
        background: '#FFFBEB',
        foreground: '#92400E',
        label: 'HIGH SEVERITY',
      };
    }

    return {
      border: '#94A3B8',
      background: '#F1F5F9',
      foreground: '#475569',
      label: 'OBSERVED',
    };
  };

  const actualEvents = Array.isArray(events) ? events : [];
  const highSeverityCount = actualEvents.filter((event) =>
    ['HIGH', 'CRITICAL'].includes(String(event.severity || '').toUpperCase())
  ).length;

  return (
    <section className="soc-card p-4">
      <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-[#E1E5ED]">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#FFF1F0] border border-[#FCA5A5] flex items-center justify-center">
            <Network className="w-4 h-4 text-[#C9362B]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#172033]">
              Observed Asset & IP Map
            </h2>
            <p className="text-[11px] font-mono text-[#718096]">
              Derived from backend-returned events; relationships are not inferred
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-1 rounded bg-[#F5F5F9] border border-[#E1E5ED] text-[#475569]">
          {nodes.length} observed entities
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] mb-3">
        <span className="inline-flex items-center gap-1.5 text-[#92400E]">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
          High-severity event
        </span>
        <span className="inline-flex items-center gap-1.5 text-[#475569]">
          <span className="w-2 h-2 rounded-full bg-[#94A3B8]" />
          Other observed event
        </span>
      </div>

      {nodes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[120px]">
          {nodes.map((node) => {
            const style = statusStyle(node.status);
            const Icon =
              node.type === 'host'
                ? Server
                : node.name.includes('.')
                  ? Radio
                  : Monitor;

            return (
              <button
                key={node.id}
                type="button"
                onClick={() => {
                  setSelectedNode(node);
                  if (onSelectHost) onSelectHost(node);
                }}
                className="text-left rounded-xl border bg-white p-3 flex items-center gap-3 hover:shadow-sm transition-shadow"
                style={{ borderColor: style.border }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: style.background,
                    color: style.foreground,
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#172033] truncate">
                    {node.name}
                  </div>
                  <div className="text-[10px] font-mono text-[#718096] truncate">
                    {node.ip}
                  </div>
                  <div
                    className="text-[9px] font-mono font-bold mt-1"
                    style={{ color: style.foreground }}
                  >
                    {style.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="min-h-[120px] rounded-xl border border-dashed border-[#CBD5E1] flex flex-col items-center justify-center text-center p-6">
          <Server className="w-6 h-6 text-[#94A3B8] mb-2" />
          <p className="text-sm font-semibold text-[#475569]">
            No host or IP entities in returned events
          </p>
          <p className="text-xs text-[#718096] mt-1">
            The topology will populate when backend events include host or IP fields.
          </p>
        </div>
      )}

      {selectedNode && (
        <div className="mt-3 p-3.5 rounded-xl bg-[#F5F5F9] border border-[#E1E5ED] flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-[#C9362B] mt-0.5" />
            <div>
              <div className="text-xs font-bold text-[#172033]">
                Observed entity: {selectedNode.name}
              </div>
              <p className="text-xs text-[#718096] mt-1">
                {selectedNode.details}
              </p>
              <p className="text-[11px] text-[#475569] mt-1">
                Incident: {incident?.incidentId || incident?.incident_id || 'Not supplied'}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close entity details"
            onClick={() => setSelectedNode(null)}
            className="text-[#8995AA] hover:text-[#172033] p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-[#E1E5ED] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="text-[#475569]">
          <span className="font-bold text-[#172033]">Backend event summary: </span>
          {actualEvents.length} events · {highSeverityCount} high/critical
        </div>

        <span className="px-2 py-1 rounded bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] font-bold">
          No attack path or AI confidence asserted
        </span>
      </div>
    </section>
  );
}

export default AttackTopology;
