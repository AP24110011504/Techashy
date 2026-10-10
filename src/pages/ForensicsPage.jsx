import React, { useState } from 'react';
import {
  FileCheck2,
  Download,
  Lock,
  Key,
  ShieldCheck,
  ShieldAlert,
  Search,
  ExternalLink,
  Copy,
  Check,
  X
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { truncateHash } from '../utils/formatters';
import { exportEvidenceBundle } from '../utils/exportUtils';

export function ForensicsPage({
  forensicArtifacts = [],
  incident
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  const handleDownload = () => {
    exportEvidenceBundle(forensicArtifacts, incident);
  };

  const copyToClipboard = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredArtifacts = (forensicArtifacts || []).filter(a =>
    (a.filename || a.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.sourceHost || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.sha256 || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#E1E5ED] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-bold">
              CRYPTOGRAPHIC CHAIN OF CUSTODY
            </span>
            <span className="text-xs font-mono text-[#718096]">
              FIPS 180-4 SHA-256 Integrity Engine
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight font-sans">
            Cryptographic Forensic Artifacts Locker
          </h1>
          <p className="text-xs text-[#718096] mt-0.5">
            Immutable chain of custody with SHA-256 integrity verification
          </p>
        </div>

        {/* Download Evidence Bundle Button */}
        <button
          onClick={handleDownload}
          className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#C9362B] hover:bg-[#B92F26] active:bg-[#A82A22] shadow-sm hover:shadow flex items-center gap-2 transition-all flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download Evidence Bundle</span>
        </button>
      </div>

      {/* CRYPTOGRAPHIC METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="soc-card p-4 bg-white space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-[#8995AA]">
            Merkle Root Anchor
          </span>
          <div className="font-mono text-sm font-extrabold text-[#172033] truncate">
            0x49f1a0b40e7912d8a011832047ff12ea5092a718c399b12d54a22c198b1e42a9
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#4F9D60] pt-1 border-t border-[#E1E5ED]">
            <Lock className="w-3 h-3" />
            <span>State Tree Valid • Zero Block Drift</span>
          </div>
        </div>

        <div className="soc-card p-4 bg-white space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-[#8995AA]">
            Immutable Audit Height
          </span>
          <div className="font-mono text-2xl font-extrabold text-[#172033]">
            #14,092
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#718096] pt-1 border-t border-[#E1E5ED]">
            <span>RFC-3161 Qualified HSM Timestamps</span>
          </div>
        </div>

        <div className="soc-card p-4 bg-white space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-[#8995AA]">
            Key Architecture
          </span>
          <div className="font-mono text-sm font-extrabold text-[#172033]">
            ECDSA-secp256r1 + RSA-4096
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#4F9D60] pt-1 border-t border-[#E1E5ED]">
            <ShieldCheck className="w-3 h-3" />
            <span>Hardware Security Module Certified</span>
          </div>
        </div>
      </div>

      {/* ARTIFACTS TABLE */}
      <div className="soc-card overflow-hidden bg-white">
        <div className="p-4 border-b border-[#E1E5ED] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8995AA]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search evidence files or hashes..."
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-[#F5F5F9] border border-[#E1E5ED] text-xs text-[#172033] outline-none"
            />
          </div>

          <span className="text-xs font-mono text-[#718096]">
            {filteredArtifacts.length} Sealed Evidence Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F5F9] border-b border-[#E1E5ED] text-[10px] font-mono font-bold uppercase tracking-wider text-[#718096]">
                <th className="py-3 px-4">FILE ARTIFACT</th>
                <th className="py-3 px-4">SIZE</th>
                <th className="py-3 px-4">SHA-256 CHECKSUM</th>
                <th className="py-3 px-4">HOST SOURCE</th>
                <th className="py-3 px-4">INTEGRITY STATUS</th>
                <th className="py-3 px-4 text-right">INSPECT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E5ED] text-xs">
              {filteredArtifacts && filteredArtifacts.length > 0 ? (
                filteredArtifacts.map((art) => (
                  <tr
                    key={art.id}
                    onClick={() => setSelectedArtifact(art)}
                    className="hover:bg-[#FBF9FA] transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#172033] group-hover:text-[#C9362B] transition-colors">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-[#4F9D60] flex-shrink-0" />
                        <span>{art.filename}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#718096]">
                      {art.fileSize}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#172033]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">{truncateHash(art.sha256, 10, 10)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(art.sha256);
                          }}
                          title="Copy Full SHA-256 Hash"
                          className="p-1 text-[#8995AA] hover:text-[#172033]"
                        >
                          {copiedHash === art.sha256 ? <Check className="w-3 h-3 text-[#4F9D60]" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#718096]">
                      {art.sourceHost}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={art.integrityStatus} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedArtifact(art);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#718096] hover:text-[#172033] bg-[#F5F5F9] hover:bg-[#E1E5ED] transition-colors"
                      >
                        Verify
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-[#8995AA]">
                    No evidence records matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ARTIFACT INSPECTION MODAL */}
      {selectedArtifact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-[#E1E5ED] shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 font-mono text-xs">
            <div className="flex items-start justify-between border-b border-[#E1E5ED] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#C9362B]">{selectedArtifact.id}</span>
                  <StatusBadge status={selectedArtifact.integrityStatus} />
                </div>
                <h3 className="text-sm font-bold text-[#172033] mt-1 font-sans">
                  {selectedArtifact.filename}
                </h3>
              </div>
              <button
                onClick={() => setSelectedArtifact(null)}
                className="text-[#8995AA] hover:text-[#172033] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-[#8995AA] uppercase block mb-1">Calculated SHA-256 Checksum</span>
                <div className="p-2.5 rounded-lg bg-[#F5F5F9] border border-[#E1E5ED] text-[11px] break-all text-[#172033] select-all font-bold">
                  {selectedArtifact.sha256}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-2.5 rounded-lg bg-[#F5F5F9] border border-[#E1E5ED]">
                  <span className="text-[10px] text-[#8995AA] uppercase block">Host Source</span>
                  <span className="font-bold text-[#172033]">{selectedArtifact.sourceHost}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F5F5F9] border border-[#E1E5ED]">
                  <span className="text-[10px] text-[#8995AA] uppercase block">File Size</span>
                  <span className="font-bold text-[#172033]">{selectedArtifact.fileSize}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[#8995AA] uppercase block mb-1">Cryptographic Signer & Merkle Proof</span>
                <div className="p-2.5 rounded-lg bg-[#F5F5F9] border border-[#E1E5ED] space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#8995AA]">Signer Key ID:</span>
                    <span className="text-[#4F9D60] font-bold">{selectedArtifact.signerKeyId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8995AA]">Chain Proof:</span>
                    <span className="text-[#172033] font-bold">{selectedArtifact.chainProof}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8995AA]">Seal Timestamp:</span>
                    <span className="text-[#718096]">{selectedArtifact.verifiedAt}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E1E5ED]">
              <button
                onClick={() => setSelectedArtifact(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#172033] bg-white border border-[#E1E5ED] hover:bg-[#F5F5F9]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
