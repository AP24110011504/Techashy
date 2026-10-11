/**
 * Formats ISO date string into readable SOC timestamp
 * @param {string} isoString
 * @returns {string}
 */
export function formatSocTimestamp(isoString) {
  if (!isoString) return '--:--:--';
  try {
    const d = new Date(isoString);
    return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  } catch {
    return isoString;
  }
}

/**
 * Truncates long SHA256 hashes cleanly (e.g. 7f83b165...126d9069)
 * @param {string} hash
 * @param {number} prefixLength
 * @param {number} suffixLength
 * @returns {string}
 */
export function truncateHash(hash, prefixLength = 8, suffixLength = 8) {
  if (!hash) return 'N/A';
  if (hash.length <= prefixLength + suffixLength) return hash;
  return `${hash.slice(0, prefixLength)}...${hash.slice(-suffixLength)}`;
}

/**
 * Returns color classes for threat scores (0-100)
 * @param {number} score
 * @returns {string}
 */
export function getThreatScoreColor(score) {
  if (score >= 80) return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30';
  if (score >= 50) return 'text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30';
  return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30';
}

/**
 * Returns color classes for source trust scores (0-100)
 * @param {number} score
 * @returns {string}
 */
export function getTrustScoreColor(score) {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}
