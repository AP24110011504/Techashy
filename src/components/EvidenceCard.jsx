import React from 'react';
import { StatusBadge } from './StatusBadge';
import { truncateHash, formatSocTimestamp } from '../utils/formatters';
import { CheckCircle2, ShieldCheck, Key, Layers } from 'lucide-react';

export function EvidenceCard({ evidence }) {
  return (
    <div className="soc-surface p-3.5 rounded border border-border mb-3 hover:border-border/90 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-mono font-semibold text-text-primary">
            {evidence.id}
          </span>
          <span className="text-xs text-text-secondary font-mono">
            ({evidence.source})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <StatusBadge status={evidence.integrityResult} size="xs" label={evidence.integrityResult} />
        </div>
      </div>

      {/* Verification Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-2 rounded bg-card border border-border flex items-center justify-between">
          <span className="text-text-secondary flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Hash Check:
          </span>
          <StatusBadge status={evidence.hashVerification} size="xs" />
        </div>

        <div className="p-2 rounded bg-card border border-border flex items-center justify-between">
          <span className="text-text-secondary flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Digital Signature:
          </span>
          <StatusBadge status={evidence.signatureVerification} size="xs" />
        </div>
      </div>

      {/* Cryptographic Key Details & Hash comparison */}
      <div className="mt-2.5 pt-2 border-t border-border/40 space-y-1.5 text-[11px] font-mono">
        <div className="flex items-center justify-between text-text-secondary">
          <span>Signer Key ID:</span>
          <span className="text-text-primary">{evidence.signerKeyId || 'ECDSA-P256-NODE'}</span>
        </div>

        <div className="flex items-center justify-between text-text-secondary">
          <span>Calculated Hash:</span>
          <span className="text-accent" title={evidence.calculatedHash}>
            {truncateHash(evidence.calculatedHash, 8, 8)}
          </span>
        </div>

        <div className="flex items-center justify-between text-text-secondary">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-text-secondary" />
            Merkle Proof:
          </span>
          <span className="text-text-secondary">{evidence.chainProof || 'verified-chain'}</span>
        </div>

        <div className="flex items-center justify-between text-text-secondary pt-1 text-[10px]">
          <span>Verified At:</span>
          <span>{formatSocTimestamp(evidence.verificationTimestamp)}</span>
        </div>
      </div>
    </div>
  );
}
