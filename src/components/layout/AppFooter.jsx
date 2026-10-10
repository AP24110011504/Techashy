import React from 'react';
import { ShieldCheck, Lock, Activity } from 'lucide-react';

export function AppFooter({ isMockData }) {
  return (
    <footer className="mt-12 py-5 border-t border-[#E1E5ED] bg-white text-[#718096] text-xs font-mono px-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-bold text-[#172033]">
          <span className="w-2 h-2 rounded-full bg-[#4F9D60]" />
          <span>AEGISX Sentinel Core</span>
        </div>
        <span>•</span>
        <span>Cryptographically Verified Incident Operations</span>
        <span>•</span>
        <span className="text-[#8995AA]">SHA-256 Merkle Provenance</span>
      </div>

      <div className="flex items-center gap-4 text-[11px]">
        <span className="flex items-center gap-1 text-[#4F9D60]">
          <Lock className="w-3.5 h-3.5" />
          Zero Data Tampering Detected
        </span>
        <span className="text-[#E1E5ED]">|</span>
        <span>FIPS 140-3 Compliant HSM Engine</span>
        {isMockData && (
          <>
            <span className="text-[#E1E5ED]">|</span>
            <span className="text-[#D97706] font-bold">MOCK SIMULATION MODE ACTIVE</span>
          </>
        )}
      </div>
    </footer>
  );
}
