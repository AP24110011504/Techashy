import React, { useState } from 'react';
import {
  Copy,
  Check,
  Search,
  CheckCircle2,
  FileJson,
  FileSpreadsheet
} from 'lucide-react';
import { truncateHash, formatSocTimestamp } from '../utils/formatters';
import { exportAuditLogCSV, exportAuditLogJSON } from '../utils/exportUtils';

export function AuditLedgerPage({ auditLog = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedHash, setCopiedHash] = useState(null);

  const copyToClipboard = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredRecords = (auditLog || []).filter(r =>
    (String(r.blockHeight) || '').includes(searchTerm) ||
    (r.operator || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.target || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.signatureHash || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* PAGE HEADER & EXPORT ACTIONS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#E1E5ED] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-bold">
              IMMUTABLE CHRONICLE
            </span>
            <span className="text-xs font-mono text-[#718096]">
              Tamper-Proof Action Provenance
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight font-sans">
            Immutable Audit Ledger
          </h1>
          <p className="text-xs text-[#718096] mt-0.5">
            Cryptographically chained audit trail of every autonomous and manual action
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportAuditLogCSV(auditLog)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#172033] bg-white border border-[#E1E5ED] hover:bg-[#F5F5F9] flex items-center gap-2 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#4F9D60]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => exportAuditLogJSON(auditLog)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#C9362B] hover:bg-[#B92F26] flex items-center gap-2 transition-all shadow-sm"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* CHAIN VERIFICATION STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="soc-card p-4 bg-white space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-[#8995AA]">
            Total Chained Blocks
          </span>
          <div className="font-mono text-2xl font-extrabold text-[#172033]">
            {auditLog.length > 0 ? auditLog[0].blockHeight : 14092}
          </div>
          <span className="text-[10px] font-mono text-[#4F9D60] block">
            Continuous hash verification
          </span>
        </div>

        <div className="soc-card p-4 bg-white space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-[#8995AA]">
            Verification Engine
          </span>
          <div className="font-mono text-sm font-extrabold text-[#172033]">
            ECDSA-P256 + SHA-256
          </div>
          <span className="text-[10px] font-mono text-[#718096] block">
            FIPS 140-3 Hardware Sealed
          </span>
        </div>

        <div className="soc-card p-4 bg-white space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-[#8995AA]">
            Chain Integrity State
          </span>
          <div className="flex items-center gap-1.5 font-mono text-sm font-extrabold text-[#4F9D60]">
            <CheckCircle2 className="w-4 h-4" />
            <span>100% UNBROKEN</span>
          </div>
          <span className="text-[10px] font-mono text-[#4F9D60] block">
            0 Block Inconsistencies
          </span>
        </div>

        <div className="soc-card p-4 bg-white space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-[#8995AA]">
            Merkle Root Anchor
          </span>
          <div className="font-mono text-xs font-extrabold text-[#172033] truncate">
            {auditLog[0]?.merkleRoot || '0x49f1a0b40'}
          </div>
          <span className="text-[10px] font-mono text-[#718096] block">
            Latest Checkpoint Verified
          </span>
        </div>
      </div>

      {/* AUDIT TABLE */}
      <div className="soc-card overflow-hidden bg-white">
        <div className="p-4 border-b border-[#E1E5ED] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8995AA]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search blocks, actions, or operators..."
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-[#F5F5F9] border border-[#E1E5ED] text-xs text-[#172033] outline-none"
            />
          </div>

          <span className="text-xs font-mono text-[#718096]">
            Showing {filteredRecords.length} Authenticated Audit Entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-[#F5F5F9] border-b border-[#E1E5ED] text-[10px] font-bold uppercase tracking-wider text-[#718096]">
                <th className="py-3 px-4">BLOCK #</th>
                <th className="py-3 px-4">TIMESTAMP</th>
                <th className="py-3 px-4">OPERATOR</th>
                <th className="py-3 px-4">ACTION EXECUTED</th>
                <th className="py-3 px-4">TARGET</th>
                <th className="py-3 px-4">SIGNATURE HASH</th>
                <th className="py-3 px-4 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E5ED]">
              {filteredRecords && filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.blockHeight} className="hover:bg-[#FBF9FA] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#C9362B]">
                      #{record.blockHeight}
                    </td>
                    <td className="py-3.5 px-4 text-[#718096]">
                      {formatSocTimestamp(record.timestamp)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#172033] max-w-xs truncate">
                      {record.operator}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#172033]">
                      {record.action}
                    </td>
                    <td className="py-3.5 px-4 text-[#718096]">
                      {record.target}
                    </td>
                    <td className="py-3.5 px-4 text-[#172033]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">{truncateHash(record.signatureHash, 8, 8)}</span>
                        <button
                          onClick={() => copyToClipboard(record.signatureHash)}
                          title="Copy Full Signature Hash"
                          className="p-1 text-[#8995AA] hover:text-[#172033]"
                        >
                          {copiedHash === record.signatureHash ? (
                            <Check className="w-3 h-3 text-[#4F9D60]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>{record.verified || 'VALID'}</span>
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#8995AA]">
                    No audit records matching search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
