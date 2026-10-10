import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
  Server,
  Zap,
  RotateCcw,
  FileText,
  Activity,
  HardDrive
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export function ContainmentPage({
  containmentAction,
  containmentHosts = [],
  onApproveAction,
  isApproving,
  onTriggerEmergencyLockdown,
  isLockingDown
}) {
  const [analystNote, setAnalystNote] = useState('Approved containment under SOC SOP-402 by Lead Analyst.');
  const [actionFeedback, setActionFeedback] = useState(null);
  const [isLockdownModalOpen, setIsLockdownModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [pendingDecision, setPendingDecision] = useState('APPROVED');

  const isExecuted = containmentAction?.status === 'EXECUTED';
  const isRejected = containmentAction?.status === 'REJECTED';

  const handleOpenApprovalDialog = (decision) => {
    setPendingDecision(decision);
    setIsApprovalModalOpen(true);
  };

  const handleConfirmApproval = async () => {
    setIsApprovalModalOpen(false);
    if (onApproveAction) {
      await onApproveAction(pendingDecision, analystNote);
      setActionFeedback({
        type: pendingDecision === 'APPROVED' ? 'success' : 'info',
        message: pendingDecision === 'APPROVED'
          ? 'Containment action ACT-ISO-PROD-DB executed. Network interfaces severed and IAM credentials revoked.'
          : 'Containment proposal rejected by SOC lead.'
      });
    }
  };

  const handleConfirmLockdown = async () => {
    setIsLockdownModalOpen(false);
    if (onTriggerEmergencyLockdown) {
      const res = await onTriggerEmergencyLockdown('Emergency enterprise lockdown engaged by Lead Analyst');
      setActionFeedback({
        type: 'danger',
        message: 'EMERGENCY LOCKDOWN ACTIVE: All non-essential interfaces severed across corporate VPC.'
      });
    }
  };

  const handleHostAction = (hostname, actionName) => {
    setActionFeedback({
      type: 'info',
      message: `${actionName} command dispatched to host ${hostname}. Agent telemetry verified.`
    });
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER & EMERGENCY LOCKDOWN BUTTON */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#E1E5ED] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFF1F0] text-[#C9362B] border border-[#FCA5A5] font-bold">
              ZERO-TRUST MICROSEGMENTATION
            </span>
            <span className="text-xs font-mono text-[#718096]">
              Lateral Movement Neutralization Engine
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight font-sans">
            Active Quarantine & Microsegmentation Controls
          </h1>
          <p className="text-xs text-[#718096] mt-0.5">
            Endpoints severed from network access to neutralize active cyber infections
          </p>
        </div>

        {/* Prominent Red Emergency Lockdown Button */}
        <button
          onClick={() => setIsLockdownModalOpen(true)}
          disabled={isLockingDown}
          className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#C9362B] hover:bg-[#B92F26] active:bg-[#A82A22] disabled:bg-[#C9362B]/70 shadow-sm hover:shadow flex items-center gap-2 transition-all flex-shrink-0"
        >
          <AlertOctagon className="w-4 h-4 fill-white text-[#C9362B]" />
          <span>{isLockingDown ? 'Locking Down Enterprise...' : 'Engage Emergency Lockdown'}</span>
        </button>
      </div>

      {/* FEEDBACK BANNER */}
      {actionFeedback && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-150 ${
          actionFeedback.type === 'danger'
            ? 'bg-[#FFF1F0] text-[#C9362B] border-[#FCA5A5]'
            : actionFeedback.type === 'success'
            ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
            : 'bg-[#F5F5F9] text-[#172033] border-[#E1E5ED]'
        }`}>
          <div className="flex items-center gap-2 font-medium">
            {actionFeedback.type === 'danger' ? (
              <ShieldAlert className="w-4 h-4 text-[#C9362B]" />
            ) : actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#166534]" />
            ) : (
              <Activity className="w-4 h-4 text-[#718096]" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs font-bold underline text-current"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* HUMAN-IN-THE-LOOP CONTAINMENT PROPOSAL CARD */}
      <div className="soc-card p-6 bg-white border border-[#E1E5ED] shadow-sm space-y-5">
        <div className="flex items-start justify-between border-b border-[#E1E5ED] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF1F0] text-[#C9362B] border border-[#FCA5A5] flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#C9362B]">
                  PROPOSAL: {containmentAction?.actionId || 'ACT-ISO-PROD-DB'}
                </span>
                <StatusBadge status={containmentAction?.status || 'PENDING'} />
              </div>
              <h2 className="text-base font-extrabold text-[#172033] mt-0.5 tracking-tight font-sans">
                {containmentAction?.actionName || 'Isolate Database Read Replica and Revoke IAM Session'}
              </h2>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-mono text-[#8995AA] uppercase block">Expected Risk Reduction</span>
            <span className="text-lg font-extrabold text-[#4F9D60] font-mono">
              {containmentAction?.riskReduction || '85%'}
            </span>
          </div>
        </div>

        {/* Blast Radius & Impact Specs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-[#F5F5F9] border border-[#E1E5ED] space-y-1">
            <span className="text-[10px] font-bold uppercase text-[#8995AA] block">Target Resource</span>
            <span className="font-bold text-[#172033] block">prod-db-replica-02 [10.0.4.18]</span>
            <span className="text-[11px] text-[#718096] font-sans">Network Interface eth1 & AWS STS credentials</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F5F5F9] border border-[#E1E5ED] space-y-1">
            <span className="text-[10px] font-bold uppercase text-[#8995AA] block">Operational Impact</span>
            <span className="font-bold text-[#172033] block">Minimal Service Disruption</span>
            <span className="text-[11px] text-[#718096] font-sans">
              {containmentAction?.potentialImpact || 'Read queries redirected to backup cluster. Expected latency < 45ms.'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F5F5F9] border border-[#E1E5ED] space-y-1">
            <span className="text-[10px] font-bold uppercase text-[#8995AA] block">Correlated Evidence</span>
            <span className="font-bold text-[#C9362B] block">EVT-1003, EVT-1004, EVD-4091</span>
            <span className="text-[11px] text-[#718096] font-sans">Unsigned binary injection & customer table read exfiltration</span>
          </div>
        </div>

        {/* Execution Result Banner if Executed */}
        {isExecuted && (
          <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-1 text-xs">
            <div className="flex items-center gap-2 text-[#166534] font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>CONTAINMENT ACTION SUCCESSFULLY ENFORCED</span>
            </div>
            <p className="text-[#166534] font-mono text-[11px]">
              {containmentAction.outcome || 'Network interface eth1 quarantined. Service token revoked. Egress dropped to 0 KB/s.'}
            </p>
            <span className="text-[10px] text-[#15803D] block pt-1">
              Executed at {containmentAction.executedAt || new Date().toISOString()} • Recorded in Audit Ledger #14093
            </span>
          </div>
        )}

        {/* Approval Controls */}
        {!isExecuted && (
          <div className="pt-2 border-t border-[#E1E5ED] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={analystNote}
                onChange={(e) => setAnalystNote(e.target.value)}
                placeholder="Analyst authorization notes..."
                className="w-full h-10 px-3.5 rounded-xl bg-[#F5F5F9] border border-[#E1E5ED] focus:bg-white focus:border-[#C9362B] text-xs text-[#172033] outline-none"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleOpenApprovalDialog('REJECTED')}
                disabled={isApproving}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#718096] bg-white border border-[#E1E5ED] hover:bg-[#F5F5F9] hover:text-[#172033] transition-colors"
              >
                Reject Action
              </button>

              <button
                type="button"
                onClick={() => handleOpenApprovalDialog('APPROVED')}
                disabled={isApproving}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#C9362B] hover:bg-[#B92F26] disabled:bg-[#C9362B]/70 shadow-sm flex items-center gap-2 transition-all"
              >
                {isApproving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authorizing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Approve & Enforce Containment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QUARANTINE & MICROSEGMENTATION HOSTS TABLE */}
      <div className="soc-card overflow-hidden bg-white">
        <div className="p-4 border-b border-[#E1E5ED] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#C9362B]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
              Active Quarantine & Microsegmentation Controls
            </h3>
          </div>
          <span className="text-xs font-mono text-[#718096]">
            {containmentHosts.length} Network Nodes Monitored
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F5F9] border-b border-[#E1E5ED] text-[10px] font-mono font-bold uppercase tracking-wider text-[#718096]">
                <th className="py-3 px-4">HOST NAME</th>
                <th className="py-3 px-4">IP ADDRESS</th>
                <th className="py-3 px-4">ISOLATION STATUS</th>
                <th className="py-3 px-4">REASON</th>
                <th className="py-3 px-4">AGENT UPTIME</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E5ED] text-xs">
              {containmentHosts && containmentHosts.length > 0 ? (
                containmentHosts.map((host) => (
                  <tr key={host.hostname} className="hover:bg-[#FBF9FA] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#172033]">
                      {host.hostname}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#718096]">
                      {host.ipAddress}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={host.isolationStatus} />
                    </td>
                    <td className="py-3.5 px-4 text-[#718096] max-w-xs truncate">
                      {host.reason}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#718096]">
                      {host.agentUptime}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleHostAction(host.hostname, 'Dump Memory')}
                          className="px-2 py-1 rounded bg-[#F5F5F9] hover:bg-[#E1E5ED] text-[10px] font-mono text-[#718096] hover:text-[#172033] transition-colors"
                        >
                          Dump Memory
                        </button>
                        <button
                          onClick={() => handleHostAction(host.hostname, 'Flush Sockets')}
                          className="px-2 py-1 rounded bg-[#F5F5F9] hover:bg-[#E1E5ED] text-[10px] font-mono text-[#718096] hover:text-[#172033] transition-colors"
                        >
                          Flush Sockets
                        </button>
                        {host.isolationStatus === 'ISOLATED' ? (
                          <button
                            onClick={() => handleHostAction(host.hostname, 'Release Isolation')}
                            className="px-2 py-1 rounded bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-[10px] font-mono font-bold hover:bg-[#DCFCE7] transition-colors"
                          >
                            Release
                          </button>
                        ) : (
                          <button
                            onClick={() => handleHostAction(host.hostname, 'Quarantine Node')}
                            className="px-2 py-1 rounded bg-[#FFF1F0] text-[#C9362B] border border-[#FCA5A5] text-[10px] font-mono font-bold hover:bg-[#FEE2E2] transition-colors"
                          >
                            Quarantine
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-[#8995AA]">
                    No host telemetry records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRMATION MODAL FOR EMERGENCY LOCKDOWN */}
      <ConfirmDialog
        isOpen={isLockdownModalOpen}
        title="Engage Emergency Enterprise Lockdown?"
        message="WARNING: This action will enforce global microsegmentation, severing non-essential VPC interfaces and revoking temporary session credentials across all monitored hosts. This operation has a high operational blast radius."
        confirmLabel="Enforce Emergency Lockdown"
        confirmVariant="danger"
        onConfirm={handleConfirmLockdown}
        onCancel={() => setIsLockdownModalOpen(false)}
        isProcessing={isLockingDown}
      />

      {/* CONFIRMATION MODAL FOR CONTAINMENT PROPOSAL */}
      <ConfirmDialog
        isOpen={isApprovalModalOpen}
        title={pendingDecision === 'APPROVED' ? "Authorize Host Isolation (ACT-ISO-PROD-DB)?" : "Reject Containment Proposal?"}
        message={pendingDecision === 'APPROVED'
          ? "Target host prod-db-replica-02 will be quarantined at the OpenFlow edge switch and active AWS STS tokens for svc_backup_admin will be invalidated. Expected latency increase < 45ms."
          : "Are you sure you want to reject this autonomous containment recommendation? Lateral exfiltration may continue if unmitigated."}
        confirmLabel={pendingDecision === 'APPROVED' ? "Authorize Containment" : "Confirm Rejection"}
        confirmVariant={pendingDecision === 'APPROVED' ? "danger" : "default"}
        onConfirm={handleConfirmApproval}
        onCancel={() => setIsApprovalModalOpen(false)}
        isProcessing={isApproving}
      />
    </div>
  );
}
