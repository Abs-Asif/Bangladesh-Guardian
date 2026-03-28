import { describe, it, expect } from 'vitest';
import { isTruncated, shouldUpgradeTitle } from '../title-utils';

describe('title-utils', () => {
  describe('isTruncated', () => {
    it('returns true for strings ending with ...', () => {
      expect(isTruncated('Hello World...')).toBe(true);
      expect(isTruncated('Hello World ...')).toBe(true);
    });

    it('returns true for strings ending with …', () => {
      expect(isTruncated('Hello World…')).toBe(true);
    });

    it('returns false for strings that do not end with ellipsis', () => {
      expect(isTruncated('Hello World')).toBe(false);
      expect(isTruncated('Hello World.')).toBe(false);
      expect(isTruncated('Hello. World')).toBe(false);
    });

    it('handles empty or null input', () => {
      expect(isTruncated('')).toBe(false);
      expect(isTruncated(null as any)).toBe(false);
    });
  });

  describe('shouldUpgradeTitle', () => {
    it('prefers a full title over a truncated one', () => {
      const apiTitle = 'This is a very long title that is complete';
      const htmlTitle = 'This is a very long title that...';

      // htmlTitle has fewer words but the key point is truncation
      expect(shouldUpgradeTitle(apiTitle, htmlTitle)).toBe(false);
      expect(shouldUpgradeTitle(htmlTitle, apiTitle)).toBe(true);
    });

    it('prefers a longer title if both are full', () => {
      const shortTitle = 'Short Title';
      const longTitle = 'A Much Longer Title With More Words';

      expect(shouldUpgradeTitle(shortTitle, longTitle)).toBe(true);
      expect(shouldUpgradeTitle(longTitle, shortTitle)).toBe(false);
    });

    it('prefers a longer title if both are truncated', () => {
      const shortTruncated = 'Short...';
      const longTruncated = 'A longer title that is also...';

      expect(shouldUpgradeTitle(shortTruncated, longTruncated)).toBe(true);
      expect(shouldUpgradeTitle(longTruncated, shortTruncated)).toBe(false);
    });

    it('does not upgrade if titles are identical', () => {
      expect(shouldUpgradeTitle('Same', 'Same')).toBe(false);
    });

    it('handles titles with same word count but one is truncated', () => {
       // This is a edge case where word counts might be equal due to filler words vs truncation
       const truncated = 'Word1 Word2 Word3...'; // 3 words
       const full = 'Word1 Word2 Word3'; // 3 words

       expect(shouldUpgradeTitle(full, truncated)).toBe(false);
       expect(shouldUpgradeTitle(truncated, full)).toBe(true);
    });

    it('uses character length as a tie-breaker for same word count', () => {
      const shorter = 'Hello World'; // 11 chars
      const longer = 'Hello Worlds'; // 12 chars

      expect(shouldUpgradeTitle(shorter, longer)).toBe(true);
      expect(shouldUpgradeTitle(longer, shorter)).toBe(false);
    });
  });
});
