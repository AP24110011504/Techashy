import React from 'react';
import { Lock, FileCheck2, ShieldCheck, Download, ExternalLink, Key } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { truncateHash } from '../../utils/formatters';

export function ForensicLockbox({ evidence = [], onDownloadBundle, onSelectArtifact }) {
  return (
    <div className="soc-card p-5 flex flex-col h-full bg-white">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E1E5ED]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FFF1F0] text-[#C9362B] border border-[#FCA5A5] flex items-center justify-center">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
              Forensic Lockbox
            </h3>
            <span className="text-[10px] font-mono text-[#718096]">
              Immutable SHA-256 evidence chain
            </span>
          </div>
        </div>

        {onDownloadBundle && (
          <button
            onClick={onDownloadBundle}
            title="Download Cryptographic Evidence Bundle"
            className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#F5F5F9] hover:bg-[#FFF1F0] text-[#172033] hover:text-[#C9362B] border border-[#E1E5ED] hover:border-[#FCA5A5] transition-all flex items-center gap-1.5"
          >
            <Download className="w-3 h-3" />
            <span>Bundle</span>
          </button>
        )}
      </div>

      {/* ARTIFACT LIST */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[360px]">
        {evidence && evidence.length > 0 ? (
          evidence.map((evItem) => (
            <div
              key={evItem.id}
              onClick={() => onSelectArtifact && onSelectArtifact(evItem)}
              className="p-3 rounded-xl bg-[#F5F5F9] hover:bg-[#FFF1F0]/40 border border-[#E1E5ED] hover:border-[#FCA5A5] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#172033] truncate group-hover:text-[#C9362B] transition-colors flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-[#4F9D60] flex-shrink-0" />
                  <span className="truncate">{evItem.filename || evItem.id}</span>
                </span>
                <StatusBadge status={evItem.integrityResult || evItem.hashVerification || 'VALID'} />
              </div>

              <div className="space-y-1 text-[11px] font-mono">
                <div className="flex items-center justify-between text-[#718096]">
                  <span className="text-[#8995AA]">Source:</span>
                  <span className="truncate max-w-[170px] font-semibold text-[#172033]">
                    {evItem.sourceHost || evItem.source}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[#718096]">
                  <span className="text-[#8995AA]">SHA-256:</span>
                  <span className="text-[#172033] font-bold">
                    {truncateHash(evItem.sha256 || evItem.calculatedHash, 8, 8)}
                  </span>
                </div>

                {evItem.signerKeyId && (
                  <div className="flex items-center justify-between text-[#718096] pt-1 border-t border-[#E1E5ED]/70">
                    <span className="text-[#8995AA] flex items-center gap-1">
                      <Key className="w-2.5 h-2.5" />
                      Signer:
                    </span>
                    <span className="text-[#4F9D60] font-bold truncate max-w-[160px]">
                      {evItem.signerKeyId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-xs text-[#8995AA] space-y-1">
            <p className="font-semibold text-[#172033]">Lockbox Nominal</p>
            <p>Cryptographic artifacts populate upon incident detection.</p>
          </div>
        )}
      </div>
    </div>
  );
}
