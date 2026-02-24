import { describe, it, expect } from 'vitest';
import { censorText, defaultMappings } from '../censor';

describe('censorText', () => {
  it('should censor default prohibited words', () => {
    const input = 'Killing is bad. Israel and Gaza.';
    const output = censorText(input);
    expect(output).toContain('ki*lling');
    expect(output).toContain('Isr*ael');
    expect(output).toContain('Ga*za');
  });

  it('should not censor words that were removed (fuck)', () => {
    const input = 'This is fucking crazy.';
    const output = censorText(input);
    expect(output).toBe(input);
  });

  it('should use custom mappings when provided', () => {
    const customMappings = { 'Apple': 'A*pple' };
    const input = 'I like Apple.';
    const output = censorText(input, customMappings);
    expect(output).toBe('I like A*pple.');
  });

  it('should handle case-insensitivity', () => {
    const input = 'KILLING IS BAD.';
    const output = censorText(input);
    expect(output).toBe('ki*lling IS BAD.'); // mappings['Kill'] is 'k*ill', but regex is 'gi'
    // Wait, let's see how replace works with 'gi' and fixed replacement string.
    // 'Kill' -> 'k*ill'
    // 'KILLING' matches 'Killing' (gi)
    // replace('KILLING', 'ki*lling') -> 'ki*lling'
  });

  it('should sort mappings by length descending', () => {
    const customMappings = {
      'Murder': 'M*rder',
      'Murdered': 'M*rdered'
    };
    const input = 'He was Murdered.';
    const output = censorText(input, customMappings);
    expect(output).toBe('He was M*rdered.');
  });
});
