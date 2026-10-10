import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ShieldAlert,
  Clock,
  Server,
  ArrowRight,
  Eye,
  AlertTriangle,
  X,
  FileCheck2,
  Lock
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatSocTimestamp } from '../utils/formatters';

export function IncidentsPage({
  incidents = [],
  events = [],
  onNavigate
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return (incidents || []).filter(inc => {
      const matchesSearch =
        (inc.incidentId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inc.attackVector || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inc.targetHost || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inc.ipAddress || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (severityFilter === 'ALL') return true;
      if (severityFilter === 'CRITICAL') return inc.severity === 'CRITICAL';
      if (severityFilter === 'HIGH') return inc.severity === 'HIGH';
      if (severityFilter === 'MEDIUM') return inc.severity === 'MEDIUM' || inc.severity === 'LOW';
      return true;
    });
  }, [incidents, searchTerm, severityFilter]);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="pb-4 border-b border-[#E1E5ED]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFF1F0] text-[#C9362B] border border-[#FCA5A5] font-bold">
            SOC TRIAGE QUEUE
          </span>
          <span className="text-xs font-mono text-[#718096]">
            {filteredIncidents.length} Records Identified
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight font-sans">
          All Incident Triage Operations
        </h1>
        <p className="text-xs text-[#718096] mt-0.5">
          Active threats, compromised vectors, and autonomous response status
        </p>
      </div>

      {/* FILTER & SEARCH CARD */}
      <div className="soc-card p-4 bg-white flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8995AA]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, vector, host, or IP..."
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-[#F5F5F9] border border-[#E1E5ED] focus:bg-white focus:border-[#C9362B] text-xs text-[#172033] placeholder-[#8995AA] outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-[#8995AA] hover:text-[#172033]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSeverityFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              severityFilter === 'ALL'
                ? 'bg-[#172033] text-white shadow-sm'
                : 'bg-[#F5F5F9] text-[#718096] hover:text-[#172033] border border-[#E1E5ED]'
            }`}
          >
            All Incidents ({incidents.length})
          </button>
          <button
            onClick={() => setSeverityFilter('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              severityFilter === 'CRITICAL'
                ? 'bg-[#C9362B] text-white shadow-sm'
                : 'bg-[#FFF1F0] text-[#C9362B] hover:bg-[#FEE2E2] border border-[#FCA5A5]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>Critical Danger</span>
          </button>
          <button
            onClick={() => setSeverityFilter('HIGH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              severityFilter === 'HIGH'
                ? 'bg-[#D97706] text-white shadow-sm'
                : 'bg-[#FFFBEB] text-[#92400E] hover:bg-[#FEF3C7] border border-[#FDE68A]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>High Severity</span>
          </button>
          <button
            onClick={() => setSeverityFilter('MEDIUM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              severityFilter === 'MEDIUM'
                ? 'bg-[#0369A1] text-white shadow-sm'
                : 'bg-[#F0F9FF] text-[#0369A1] hover:bg-[#E0F2FE] border border-[#BAE6FD]'
            }`}
          >
            Medium / Low
          </button>
        </div>
      </div>

      {/* INCIDENTS TABLE */}
      <div className="soc-card overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F5F9] border-b border-[#E1E5ED] text-[10px] font-mono font-bold uppercase tracking-wider text-[#718096]">
                <th className="py-3 px-4">INCIDENT ID</th>
                <th className="py-3 px-4">ATTACK VECTOR</th>
                <th className="py-3 px-4">TARGET HOST</th>
                <th className="py-3 px-4">IP ADDRESS</th>
                <th className="py-3 px-4">SEVERITY</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">DETECTED AT</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E5ED] text-xs">
              {filteredIncidents && filteredIncidents.length > 0 ? (
                filteredIncidents.map((inc) => (
                  <tr
                    key={inc.incidentId}
                    className="hover:bg-[#FBF9FA] transition-colors group cursor-pointer"
                    onClick={() => setSelectedIncident(inc)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#172033] group-hover:text-[#C9362B] transition-colors">
                      {inc.incidentId}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#172033] max-w-xs truncate">
                      {inc.attackVector}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#718096]">
                      {inc.targetHost}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#718096]">
                      {inc.ipAddress}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={inc.severity} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#718096]">
                      {formatSocTimestamp(inc.detectedAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedIncident(inc)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#718096] hover:text-[#172033] bg-[#F5F5F9] hover:bg-[#E1E5ED] transition-colors"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => onNavigate && onNavigate('/containment')}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#C9362B] bg-[#FFF1F0] hover:bg-[#FEE2E2] border border-[#FCA5A5] transition-colors flex items-center gap-1"
                        >
                          <span>Contain</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#8995AA]">
                    No incident records matched your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-[#F5F5F9] border-t border-[#E1E5ED] flex items-center justify-between text-xs font-mono text-[#718096]">
          <span>Showing {filteredIncidents.length} of {incidents.length} incidents</span>
          <span className="text-[#8995AA]">SOC Triage Policy v4.2 • Autonomous First Responder</span>
        </div>
      </div>

      {/* INCIDENT DETAILS MODAL */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#E1E5ED] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[#E1E5ED] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#C9362B]">
                    {selectedIncident.incidentId}
                  </span>
                  <StatusBadge status={selectedIncident.severity} />
                  <StatusBadge status={selectedIncident.status} />
                </div>
                <h3 className="text-base font-extrabold text-[#172033] mt-1 font-sans">
                  {selectedIncident.attackVector}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-[#8995AA] hover:text-[#172033] transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#F5F5F9] border border-[#E1E5ED]">
                <span className="text-[10px] text-[#8995AA] uppercase block">Target Host</span>
                <span className="font-bold text-[#172033] truncate block mt-0.5">{selectedIncident.targetHost}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F5F5F9] border border-[#E1E5ED]">
                <span className="text-[10px] text-[#8995AA] uppercase block">IP Address</span>
                <span className="font-bold text-[#172033] truncate block mt-0.5">{selectedIncident.ipAddress}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F5F5F9] border border-[#E1E5ED]">
                <span className="text-[10px] text-[#8995AA] uppercase block">Threat Score</span>
                <span className="font-bold text-[#C9362B] truncate block mt-0.5">{selectedIncident.threatScore || 87} / 100</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F5F5F9] border border-[#E1E5ED]">
                <span className="text-[10px] text-[#8995AA] uppercase block">Detected At</span>
                <span className="font-bold text-[#172033] truncate block mt-0.5">{formatSocTimestamp(selectedIncident.detectedAt)}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-mono font-bold uppercase text-[#718096] mb-2">
                Correlated Telemetry Timeline
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {events && events.length > 0 ? (
                  events.map(ev => (
                    <div key={ev.id} className="p-2.5 rounded-lg bg-[#F5F5F9] border border-[#E1E5ED] text-xs flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#172033]">
                          <span>{ev.id}</span>
                          <span className="text-[#8995AA]">•</span>
                          <span>{ev.source}</span>
                        </div>
                        <p className="text-[#718096] mt-0.5 font-sans leading-relaxed">{ev.description}</p>
                      </div>
                      <StatusBadge status={ev.severity} />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#8995AA]">No specific event records attached.</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E1E5ED]">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#172033] bg-white border border-[#E1E5ED] hover:bg-[#F5F5F9]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedIncident(null);
                  if (onNavigate) onNavigate('/containment');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#C9362B] hover:bg-[#B92F26] flex items-center gap-1.5"
              >
                <span>Navigate to Containment Workflow</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
