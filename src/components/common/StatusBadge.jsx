import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  MinusCircle
} from 'lucide-react';

export function StatusBadge({ status, type = 'status', className = '' }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  // Status mappings
  switch (normalized) {
    case 'VERIFIED':
    case 'VALID':
    case 'UNALTERED':
    case 'HEALTHY':
    case 'CONNECTED_HEALTHY':
    case 'NOMINAL':
    case 'NOMINAL_HEALTHY':
    case 'HSM VERIFIED / VALID':
    case 'RESOLVED_CONTAINED':
    case 'RESOLVED_CLOSED':
    case 'EXECUTED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] ${className}`}>
          <CheckCircle2 className="w-3 h-3 text-[#166534]" />
          {normalized}
        </span>
      );

    case 'DEGRADED':
    case 'SUSPICIOUS':
    case 'SUSPICIOUS_MONITORED':
    case 'WARNING':
    case 'PENDING':
    case 'CONTAINMENT_PENDING':
    case 'UNVERIFIED':
    case 'UNVERIFIED / PENDING':
    case 'ACTIVE_TRIAGE':
    case 'HIGH':
    case 'TRAFFIC_FILTERED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] ${className}`}>
          <AlertTriangle className="w-3 h-3 text-[#D97706]" />
          {normalized}
        </span>
      );

    case 'COMPROMISED':
    case 'CRITICAL':
    case 'TAMPERED':
    case 'ISOLATED':
    case 'CREDENTIALS_FROZEN':
    case 'QUARANTINE_PENDING':
    case 'DANGER':
    case 'REJECTED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold bg-[#FFF1F0] text-[#C9362B] border border-[#FCA5A5] ${className}`}>
          <ShieldAlert className="w-3 h-3 text-[#C9362B]" />
          {normalized}
        </span>
      );

    case 'MEDIUM':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold bg-[#F0F9FF] text-[#0369A1] border border-[#BAE6FD] ${className}`}>
          <Clock className="w-3 h-3 text-[#0284C7]" />
          MEDIUM
        </span>
      );

    case 'OFFLINE':
    case 'LOW':
    case 'CLOSED':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-[#F5F5F9] text-[#718096] border border-[#E1E5ED] ${className}`}>
          <MinusCircle className="w-3 h-3 text-[#718096]" />
          {normalized}
        </span>
      );
  }
}
