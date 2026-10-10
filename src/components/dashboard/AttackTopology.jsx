import React, { useState } from 'react';
import {
  Network,
  Server,
  Laptop,
  Database,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Info,
  X,
  Radio,
  Lock
} from 'lucide-react';

export function AttackTopology({ incident, events = [], onSelectHost }) {
  const [selectedNode, setSelectedNode] = useState(null);

  // Nodes for the propagation graph
  const nodes = [
    {
      id: 'ws-fin-089',
      name: 'WS-FIN-089',
      subname: 'Corporate Workstation',
      ip: '10.0.8.89',
      type: 'endpoint',
      status: 'SUSPICIOUS',
      x: 70,
      y: 130,
      details: 'Initial adversary entry vector via phishing credential hijack from unrecognized ASN 14061.',
      icon: Laptop
    },
    {
      id: 'auth-srv-us-east-1',
      name: 'AUTH-GW-01',
      subname: 'auth-srv-us-east-1',
      ip: '10.0.1.12',
      type: 'gateway',
      status: 'COMPROMISED',
      x: 270,
      y: 130,
      details: 'Okta / Cognito MFA authentication bypass. Rogue administrator session minted.',
      icon: Server
    },
    {
      id: 'iam-admin-vault',
      name: 'CORE-DMZ',
      subname: 'iam-admin-vault',
      ip: '10.0.2.5',
      type: 'security',
      status: 'COMPROMISED',
      x: 470,
      y: 130,
      details: 'Short-lived STS temporary credentials minted for role `svc_backup_admin` with elevated policy.',
      icon: Lock
    },
    {
      id: 'prod-db-replica-02',
      name: 'PROD-SQL-01',
      subname: 'prod-db-replica-02',
      ip: '10.0.4.18',
      type: 'database',
      status: 'COMPROMISED',
      x: 680,
      y: 130,
      details: 'Unsigned binary `libsystemd-patch.so` injected into PostgreSQL worker 4192. 4.2GB bulk scan.',
      icon: Database
    },
    {
      id: 'edr-relay',
      name: 'EDR Relay',
      subname: 'Falcon Cluster #09',
      ip: '10.0.10.2',
      type: 'sensor',
      status: 'VERIFIED',
      x: 470,
      y: 245,
      details: 'CrowdStrike EDR watchdog sensor reporting intact kernel hooks and memory tamper alarms.',
      icon: ShieldCheck
    },
    {
      id: 'siem-elastic',
      name: 'Elastic SIEM',
      subname: 'Audit Ingest Cluster',
      ip: '10.0.10.8',
      type: 'siem',
      status: 'VERIFIED',
      x: 270,
      y: 245,
      details: 'Log pipeline verified with RFC-3161 cryptographic timestamps and WORM storage retention.',
      icon: Radio
    }
  ];

  // Connections (edges)
  const edges = [
    { from: 'ws-fin-089', to: 'auth-srv-us-east-1', status: 'attack', label: 'Credential Replay' },
    { from: 'auth-srv-us-east-1', to: 'iam-admin-vault', status: 'attack', label: 'STS AssumeRole' },
    { from: 'iam-admin-vault', to: 'prod-db-replica-02', status: 'attack', label: 'Lateral DB Pivot' },
    { from: 'siem-elastic', to: 'auth-srv-us-east-1', status: 'telemetry', label: 'Audit Log' },
    { from: 'edr-relay', to: 'prod-db-replica-02', status: 'telemetry', label: 'EDR Sensor' }
  ];

  const getNodeColor = (status) => {
    switch (status) {
      case 'COMPROMISED':
        return {
          stroke: '#C9362B',
          bg: '#FFF1F0',
          text: '#C9362B',
          ring: 'ring-2 ring-[#FCA5A5]'
        };
      case 'SUSPICIOUS':
        return {
          stroke: '#D97706',
          bg: '#FFFBEB',
          text: '#D97706',
          ring: 'ring-2 ring-[#FDE68A]'
        };
      case 'VERIFIED':
      default:
        return {
          stroke: '#4F9D60',
          bg: '#F0FDF4',
          text: '#166534',
          ring: 'ring-1 ring-[#BBF7D0]'
        };
    }
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    if (onSelectHost) onSelectHost(node.subname || node.name);
  };

  return (
    <div className="soc-card p-5 relative overflow-hidden bg-white">
      {/* HEADER WITH TITLE & LEGEND */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-3 border-b border-[#E1E5ED] gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FFF1F0] text-[#C9362B] border border-[#FCA5A5] flex items-center justify-center">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#172033] tracking-tight">
              Autonomous Attack Propagation Topology
            </h2>
            <p className="text-[11px] font-mono text-[#718096]">
              Real-time multi-hop lateral movement mapping
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#166534]">
            <span className="w-2 h-2 rounded-full bg-[#4F9D60]" />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#92400E]">
            <span className="w-2 h-2 rounded-full bg-[#D97706]" />
            <span>Suspicious</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#C9362B]">
            <span className="w-2 h-2 rounded-full bg-[#C9362B] animate-pulse" />
            <span className="font-bold">Compromised (Danger)</span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-[#F5F5F9] border border-[#E1E5ED] text-[#718096]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F9D60] animate-ping" />
            <span>Live Stream</span>
          </div>
        </div>
      </div>

      {/* GRAPH CANVAS AREA */}
      <div className="w-full bg-[#FBF9FA] border border-[#E1E5ED] rounded-xl p-4 relative overflow-x-auto min-h-[310px] flex items-center justify-center">
        {/* Subtle Square Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `radial-gradient(#CBD5E1 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />

        {/* SVG Propagation Canvas */}
        <div className="relative min-w-[760px] w-full h-[280px]">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 760 280">
            <defs>
              {/* Arrow Markers */}
              <marker
                id="arrow-attack"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#C9362B" />
              </marker>
              <marker
                id="arrow-telemetry"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#4F9D60" />
              </marker>
            </defs>

            {/* Attack Chain Edges */}
            <path
              d="M 120 130 L 220 130"
              stroke="#C9362B"
              strokeWidth="2.5"
              strokeDasharray="5,4"
              markerEnd="url(#arrow-attack)"
              className="animate-pulse"
            />
            <path
              d="M 320 130 L 420 130"
              stroke="#C9362B"
              strokeWidth="2.5"
              strokeDasharray="5,4"
              markerEnd="url(#arrow-attack)"
              className="animate-pulse"
            />
            <path
              d="M 520 130 L 630 130"
              stroke="#C9362B"
              strokeWidth="2.5"
              strokeDasharray="5,4"
              markerEnd="url(#arrow-attack)"
              className="animate-pulse"
            />

            {/* Telemetry Watchdog Edges */}
            <path
              d="M 270 215 L 270 165"
              stroke="#4F9D60"
              strokeWidth="1.8"
              strokeDasharray="4,4"
              markerEnd="url(#arrow-telemetry)"
            />
            <path
              d="M 500 220 C 560 220, 650 200, 680 165"
              stroke="#4F9D60"
              strokeWidth="1.8"
              strokeDasharray="4,4"
              markerEnd="url(#arrow-telemetry)"
              fill="none"
            />
          </svg>

          {/* Interactive HTML Nodes */}
          {nodes.map((node) => {
            const colors = getNodeColor(node.status);
            const Icon = node.icon;
            const isSelected = selectedNode?.id === node.id;

            return (
              <div
                key={node.id}
                onClick={() => handleNodeClick(node)}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
                className={`absolute cursor-pointer select-none transition-all duration-200 group ${
                  isSelected ? 'scale-105 z-20' : 'hover:scale-102 z-10'
                }`}
              >
                {/* Node Pill Card */}
                <div
                  className={`bg-white rounded-2xl p-2.5 shadow-sm border flex items-center gap-3 w-48 ${colors.ring} ${
                    node.status === 'COMPROMISED'
                      ? 'border-[#C9362B] bg-gradient-to-b from-white to-[#FFF1F0]/40'
                      : node.status === 'SUSPICIOUS'
                      ? 'border-[#D97706] bg-gradient-to-b from-white to-[#FFFBEB]/40'
                      : 'border-[#BBF7D0] bg-white'
                  }`}
                >
                  {/* Node Icon Circle */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  </div>

                  {/* Node Text Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#172033] truncate">
                        {node.name}
                      </span>
                      <span
                        className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        {node.status === 'COMPROMISED' ? 'DANGER' : node.status}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-[#718096] truncate">
                      {node.ip}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SELECTED NODE INSPECTOR DRAWER */}
      {selectedNode && (
        <div className="mt-3 p-3.5 rounded-xl bg-[#F5F5F9] border border-[#E1E5ED] flex items-start justify-between gap-4 animate-in fade-in duration-150">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#E1E5ED] flex items-center justify-center text-[#172033] flex-shrink-0">
              <Info className="w-4 h-4 text-[#C9362B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#172033]">
                  Asset Inspector: {selectedNode.name} ({selectedNode.subname})
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#E1E5ED] text-[#718096]">
                  {selectedNode.ip}
                </span>
              </div>
              <p className="text-xs text-[#718096] mt-0.5">
                {selectedNode.details}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedNode(null)}
            className="text-[#8995AA] hover:text-[#172033] transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* BOTTOM ATTACK PATH & CONFIDENCE SUMMARY */}
      <div className="mt-3 pt-3 border-t border-[#E1E5ED] flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 text-[#718096] flex-wrap">
          <span className="font-bold text-[#172033]">Attack Path:</span>
          <span>WS-FIN-089 (ASN 14061)</span>
          <ArrowRight className="w-3 h-3 text-[#C9362B]" />
          <span>AUTH-GW-01 (MFA Bypass)</span>
          <ArrowRight className="w-3 h-3 text-[#C9362B]" />
          <span>CORE-DMZ (STS AssumeRole)</span>
          <ArrowRight className="w-3 h-3 text-[#C9362B]" />
          <span className="text-[#C9362B] font-bold">PROD-SQL-01 (libsystemd injection)</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[#8995AA]">Detection Confidence:</span>
          <span className="px-2 py-0.5 rounded bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] font-extrabold">
            94.2% AI Consensus
          </span>
        </div>
      </div>
    </div>
  );
}
