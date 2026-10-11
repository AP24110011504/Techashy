import React from 'react';
import { AlertOctagon, X, Check, ShieldAlert } from 'lucide-react';

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Action',
  confirmVariant = 'danger',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isProcessing = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#E1E5ED] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              confirmVariant === 'danger'
                ? 'bg-[#FFF1F0] text-[#C9362B] border border-[#FCA5A5]'
                : 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
            }`}>
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172033] tracking-tight">
                {title}
              </h3>
              <span className="text-[11px] font-mono text-[#8995AA] uppercase tracking-wider">
                Human-in-the-Loop Safeguard
              </span>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="text-[#8995AA] hover:text-[#172033] transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-[#718096] leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E1E5ED]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-[#172033] bg-white border border-[#E1E5ED] hover:bg-[#F5F5F9] transition-colors"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm flex items-center gap-2 transition-all ${
              confirmVariant === 'danger'
                ? 'bg-[#C9362B] hover:bg-[#B92F26] disabled:bg-[#C9362B]/60'
                : 'bg-[#D97706] hover:bg-[#B45309] disabled:bg-[#D97706]/60'
            }`}
          >
            {isProcessing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
