import { describe, it, expect } from 'vitest';
import { censorText, defaultMappings } from '../censor';

describe('censorText', () => {
  it('should censor default prohibited words (preserving case)', () => {
    const input = 'Killing is bad. Israel and Gaza.';
    const output = censorText(input);
    expect(output).toContain('Ki*lling');
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

  it('should preserve case (All Caps)', () => {
    const input = 'KILLING IS BAD.';
    const output = censorText(input);
    expect(output).toBe('KI*LLING IS BAD.');
  });

  it('should preserve case (Capitalized)', () => {
    const input = 'Rape is a crime.';
    const output = censorText(input);
    expect(output).toBe('Ra*pe is a crime.');
  });

  it('should preserve case (Mixed Case)', () => {
    const customMappings = { 'Rape': 'ra*pe' };
    const input = 'rAPe';
    const output = censorText(input, customMappings);
    expect(output).toBe('rA*Pe');
  });

  it('should preserve case (Lowercase)', () => {
    const input = 'rape';
    const output = censorText(input);
    expect(output).toBe('ra*pe');
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
