/**
 * @typedef {'VERIFIED' | 'DEGRADED' | 'COMPROMISED' | 'OFFLINE'} SourceStatus
 * @typedef {'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'} SeverityLevel
 * @typedef {'VERIFIED' | 'PENDING' | 'TAMPERED'} EvidenceStatus
 * @typedef {'VALID' | 'INVALID' | 'UNVERIFIED'} VerificationResult
 * @typedef {'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED'} ActionStatus
 *
 * @typedef {Object} SourceHealth
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {SourceStatus} status
 * @property {number} trustScore
 * @property {string} lastUpdated
 * @property {string} [telemetryRate]
 * @property {string} [summary]
 *
 * @typedef {Object} IncidentSummary
 * @property {string} incidentId
 * @property {string} incidentName
 * @property {SeverityLevel} severity
 * @property {string} detectionStatus
 * @property {number} threatScore
 * @property {string[]} affectedAssets
 * @property {string} phase
 * @property {string} [startedAt]
 *
 * @typedef {Object} TimelineEventItem
 * @property {string} id
 * @property {string} timestamp
 * @property {string} relativeTime
 * @property {string} source
 * @property {SeverityLevel} severity
 * @property {string} description
 * @property {EvidenceStatus} evidenceStatus
 * @property {string} rawHash
 * @property {string} assetId
 *
 * @typedef {Object} EvidenceRecordItem
 * @property {string} id
 * @property {string} source
 * @property {VerificationResult} hashVerification
 * @property {string} expectedHash
 * @property {string} calculatedHash
 * @property {VerificationResult} signatureVerification
 * @property {string} signerKeyId
 * @property {'UNALTERED' | 'TAMPERED' | 'SUSPECT'} integrityResult
 * @property {string} verificationTimestamp
 * @property {string} chainProof
 *
 * @typedef {Object} InvestigationFindingItem
 * @property {string} agentName
 * @property {string} finding
 * @property {number} confidence
 * @property {string[]} supportingEventIds
 * @property {string} uncertaintyNotes
 * @property {string} recommendation
 *
 * @typedef {Object} ContainmentActionItem
 * @property {string} actionId
 * @property {string} actionName
 * @property {ActionStatus} status
 * @property {string} riskReduction
 * @property {string} potentialImpact
 * @property {string} [executedAt]
 * @property {string} [outcome]
 * @property {string} [analystNote]
 */

export const SOURCE_STATUS_MAP = {
  VERIFIED: { label: 'VERIFIED', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  DEGRADED: { label: 'DEGRADED', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  COMPROMISED: { label: 'COMPROMISED', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  OFFLINE: { label: 'OFFLINE', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' }
};

export const SEVERITY_COLOR_MAP = {
  CRITICAL: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  HIGH: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  MEDIUM: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  LOW: 'text-slate-300 bg-slate-500/10 border-slate-500/20',
  INFO: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
};
