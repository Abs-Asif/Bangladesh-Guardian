/**
 * Checks if a title is truncated (ends with ellipsis).
 */
export const isTruncated = (title: string): boolean => {
  if (!title) return false;
  const trimmed = title.trim();
  return trimmed.endsWith('...') || trimmed.endsWith('…');
};

/**
 * Decides if a new title is an improvement over the current one.
 * Prioritizes non-truncated titles and uses word count as a fallback.
 */
export const shouldUpgradeTitle = (oldTitle: string, newTitle: string): boolean => {
  const oldTruncated = isTruncated(oldTitle);
  const newTruncated = isTruncated(newTitle);

  // If new is truncated and old is not, don't upgrade
  if (newTruncated && !oldTruncated) {
    return false;
  }

  // If old is truncated and new is not, definitely upgrade
  if (oldTruncated && !newTruncated) {
    return true;
  }

  // Fallback to word count if both are truncated or both are full
  const oldWords = oldTitle.split(/\s+/).filter(Boolean).length;
  const newWords = newTitle.split(/\s+/).filter(Boolean).length;

  if (newWords > oldWords) return true;
  if (newWords < oldWords) return false;

  // If word count is same, use character length as a tie-breaker
  return newTitle.length > oldTitle.length;
};
