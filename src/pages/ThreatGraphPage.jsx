import React, { useState } from 'react';
import {
  Network,
  Server,
  Laptop,
  Database,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lock,
  Radio,
  Play,
  Info
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';

export function ThreatGraphPage({
  incident,
  events = [],
  onRunSimulation,
  isSimulating,
  onNavigate
}) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Nodes for the full threat propagation graph
  const nodes = [
    {
      id: 'ws-fin-089',
      name: 'WS-FIN-089',
      label: 'Initial Entrypoint',
      ip: '10.0.8.89',
      type: 'Workstation',
      zone: 'Corporate LAN',
      status: 'SUSPICIOUS',
      x: 100,
      y: 160,
      riskScore: 78,
      stage: 'Initial Access (T1566 Phishing)',
      finding: 'Session token hijacked from finance endpoint following malicious link click.',
      icon: Laptop
    },
    {
      id: 'auth-srv-us-east-1',
      name: 'AUTH-GW-01',
      label: 'Authentication Gateway',
      ip: '10.0.1.12',
      type: 'Auth Proxy',
      zone: 'Public DMZ',
      status: 'COMPROMISED',
      x: 320,
      y: 160,
      riskScore: 92,
      stage: 'Privilege Escalation (T1078 Valid Accounts)',
      finding: 'Anomalous MFA bypass from ASN 14061. Session token issued without push verify.',
      icon: Server
    },
    {
      id: 'iam-admin-vault',
      name: 'CORE-DMZ',
      label: 'Security & Token Vault',
      ip: '10.0.2.5',
      type: 'IAM Vault',
      zone: 'Secure Management',
      status: 'COMPROMISED',
      x: 540,
      y: 160,
      riskScore: 95,
      stage: 'Lateral Movement (T1550 Use Alternate Auth)',
      finding: 'High-privilege temporary credentials minted for role `svc_backup_admin`.',
      icon: Lock
    },
    {
      id: 'prod-db-replica-02',
      name: 'PROD-SQL-01',
      label: 'Target Database Replica',
      ip: '10.0.4.18',
      type: 'Database',
      zone: 'Core DB Subnet',
      status: 'COMPROMISED',
      x: 770,
      y: 160,
      riskScore: 99,
      stage: 'Exfiltration (T1041 Exfiltration Over C2)',
      finding: 'Unsigned binary `libsystemd-patch.so` injected into worker 4192. 4.2GB exfil.',
      icon: Database
    },
    {
      id: 'edr-relay',
      name: 'EDR-RELAY-09',
      label: 'Endpoint Watchdog',
      ip: '10.0.10.2',
      type: 'Sensor Agent',
      zone: 'SOC Monitoring',
      status: 'VERIFIED',
      x: 540,
      y: 300,
      riskScore: 5,
      stage: 'Defense Telemetry Active',
      finding: 'CrowdStrike sensor kernel hooks intact and streaming memory telemetry.',
      icon: ShieldCheck
    },
    {
      id: 'elastic-siem',
      name: 'ELASTIC-SIEM',
      label: 'Immutable Audit Sink',
      ip: '10.0.10.8',
      type: 'SIEM Cluster',
      zone: 'SOC Monitoring',
      status: 'VERIFIED',
      x: 320,
      y: 300,
      riskScore: 4,
      stage: 'Audit Log Verification Intact',
      finding: 'All logs hashed with SHA-256 and verified via cryptographic Merkle root.',
      icon: Radio
    }
  ];

  const getNodeStyles = (status) => {
    switch (status) {
      case 'COMPROMISED':
        return {
          bg: '#FFF1F0',
          border: 'border-[#C9362B]',
          text: 'text-[#C9362B]',
          badgeBg: 'bg-[#FFF1F0]',
          badgeText: 'text-[#C9362B]',
          ring: 'ring-2 ring-[#FCA5A5]'
        };
      case 'SUSPICIOUS':
        return {
          bg: '#FFFBEB',
          border: 'border-[#D97706]',
          text: 'text-[#D97706]',
          badgeBg: 'bg-[#FFFBEB]',
          badgeText: 'text-[#92400E]',
          ring: 'ring-2 ring-[#FDE68A]'
        };
      case 'VERIFIED':
      default:
        return {
          bg: '#F0FDF4',
          border: 'border-[#4F9D60]',
          text: 'text-[#166534]',
          badgeBg: 'bg-[#F0FDF4]',
          badgeText: 'text-[#166534]',
          ring: 'ring-1 ring-[#BBF7D0]'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#E1E5ED] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFF1F0] text-[#C9362B] border border-[#FCA5A5] font-bold">
              TOPOLOGY MAPPING
            </span>
            <span className="text-xs font-mono text-[#718096]">
              Adversary Lateral Vector Analysis
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight font-sans">
            Full Enterprise Threat Propagation Graph
          </h1>
          <p className="text-xs text-[#718096] mt-0.5">
            Interactive vector mapping showing adversary lateral pivoting and high-value target assets
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.1, 1.4))}
            title="Zoom In"
            className="w-9 h-9 rounded-xl bg-white border border-[#E1E5ED] hover:bg-[#F5F5F9] flex items-center justify-center text-[#718096]"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.7))}
            title="Zoom Out"
            className="w-9 h-9 rounded-xl bg-white border border-[#E1E5ED] hover:bg-[#F5F5F9] flex items-center justify-center text-[#718096]"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            title="Reset Zoom"
            className="px-3 h-9 rounded-xl bg-white border border-[#E1E5ED] hover:bg-[#F5F5F9] flex items-center gap-1.5 text-xs font-mono text-[#718096]"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* LARGE SPACIOUS GRAPH CARD */}
      <div className="soc-card p-6 bg-white space-y-4">
        {/* Canvas Toolbar & Legend */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E1E5ED] text-xs font-mono">
          <div className="flex items-center gap-2 font-bold text-[#172033]">
            <Network className="w-4 h-4 text-[#C9362B]" />
            <span>Lateral Movement Attack Mesh</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[#166534]">
              <span className="w-2 h-2 rounded-full bg-[#4F9D60]" />
              Secure Nodes
            </span>
            <span className="flex items-center gap-1.5 text-[#92400E]">
              <span className="w-2 h-2 rounded-full bg-[#D97706]" />
              Suspicious Pivot
            </span>
            <span className="flex items-center gap-1.5 text-[#C9362B]">
              <span className="w-2 h-2 rounded-full bg-[#C9362B] animate-pulse" />
              Compromised / High-Value Target
            </span>
          </div>
        </div>

        {/* Graph Canvas */}
        <div className="w-full bg-[#FBF9FA] border border-[#E1E5ED] rounded-2xl p-6 relative overflow-x-auto min-h-[440px] flex items-center justify-center">
          {/* Grid Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: `radial-gradient(#CBD5E1 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />

          {/* SVG Vector Canvas */}
          <div
            className="relative min-w-[900px] w-full h-[380px] transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 900 380">
              <defs>
                <marker
                  id="full-arrow-attack"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#C9362B" />
                </marker>
                <marker
                  id="full-arrow-telemetry"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#4F9D60" />
                </marker>
              </defs>

              {/* Red Attack Propagation Arrows */}
              <path
                d="M 160 160 L 250 160"
                stroke="#C9362B"
                strokeWidth="3"
                strokeDasharray="6,4"
                markerEnd="url(#full-arrow-attack)"
                className="animate-pulse"
              />
              <path
                d="M 380 160 L 470 160"
                stroke="#C9362B"
                strokeWidth="3"
                strokeDasharray="6,4"
                markerEnd="url(#full-arrow-attack)"
                className="animate-pulse"
              />
              <path
                d="M 600 160 L 700 160"
                stroke="#C9362B"
                strokeWidth="3"
                strokeDasharray="6,4"
                markerEnd="url(#full-arrow-attack)"
                className="animate-pulse"
              />

              {/* Telemetry Sensor Arrows */}
              <path
                d="M 320 260 L 320 200"
                stroke="#4F9D60"
                strokeWidth="2"
                strokeDasharray="4,4"
                markerEnd="url(#full-arrow-telemetry)"
              />
              <path
                d="M 570 270 C 640 270, 720 240, 760 200"
                stroke="#4F9D60"
                strokeWidth="2"
                strokeDasharray="4,4"
                markerEnd="url(#full-arrow-telemetry)"
                fill="none"
              />
            </svg>

            {/* Nodes */}
            {nodes.map((node) => {
              const styles = getNodeStyles(node.status);
              const Icon = node.icon;
              const isSelected = selectedNode?.id === node.id;

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className={`absolute cursor-pointer select-none transition-all duration-200 group ${
                    isSelected ? 'scale-110 z-30' : 'hover:scale-105 z-20'
                  }`}
                >
                  <div className={`w-52 p-3 rounded-2xl bg-white border shadow-sm ${styles.border} ${styles.ring}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${styles.bg} ${styles.text}`}>
                        <Icon className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded ${styles.badgeBg} ${styles.badgeText}`}>
                        {node.status}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-[#172033] truncate">
                        {node.name}
                      </div>
                      <div className="text-[10px] text-[#718096] truncate">
                        {node.label}
                      </div>
                      <div className="text-[10px] font-mono font-semibold text-[#8995AA] mt-1 pt-1 border-t border-[#E1E5ED]">
                        {node.ip} • Risk {node.riskScore}/100
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* NODE INSPECTOR DRAWER */}
        {selectedNode && (
          <div className="p-4 rounded-xl bg-[#F5F5F9] border border-[#E1E5ED] space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#172033]">
                  Node Telemetry: {selectedNode.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#E1E5ED] text-[#718096]">
                  {selectedNode.ip} ({selectedNode.zone})
                </span>
                <StatusBadge status={selectedNode.status} />
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-xs text-[#8995AA] hover:text-[#172033] font-bold"
              >
                Dismiss
              </button>
            </div>
            <p className="text-xs text-[#172033] leading-relaxed">
              <strong>Kill Chain Vector:</strong> {selectedNode.stage} — {selectedNode.finding}
            </p>
          </div>
        )}

        {/* LATERAL MOVEMENT VECTOR BREAKDOWN BANNER */}
        <div className="p-4 rounded-xl bg-[#FFF1F0] border border-[#FCA5A5] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#C9362B] font-extrabold font-mono uppercase">
              <ShieldAlert className="w-4 h-4" />
              <span>Adversary Lateral Pivot Confirmed</span>
            </div>
            <p className="text-[#172033]">
              Cross-VPC privilege escalation traced from Workstation LAN → Public Gateway → IAM Core → Database Cluster.
            </p>
          </div>

          <button
            onClick={() => onNavigate && onNavigate('/containment')}
            className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-[#C9362B] hover:bg-[#B92F26] flex items-center gap-1.5 flex-shrink-0 shadow-sm"
          >
            <span>Quarantine Infected Nodes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
