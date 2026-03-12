export const defaultMappings: Record<string, string> = {
  'Kill': 'Ki*ll',
  'Kills': 'Ki*lls',
  'Killing': 'ki*lling',
  'Killer': 'ki*ller',
  'Killers': 'Ki*llers',
  'Killed': 'ki*lled',
  'Suicide': 'Su*icide',
  'Suicides': 'Su*icides',
  'Suicided': 'Su*icided',
  'Suiciding': 'Su*iciding',
  'Gaza': 'Ga*za',
  'Murder': 'Mu*rder',
  'Murders': 'mu*rders',
  'Murdered': 'Mu*rdered',
  'Murdering': 'mu*rdering',
  'Murderer': 'Mu*rderer',
  'Murderers': 'mu*rderers',
  'Israel': 'Isr*ael',
  'Israeli': 'Isr*aeli',
  'Israelis': 'Is*raelis',
  'Israel-based': 'Is*rael-based',
  'Israel–Palestine': 'Is*rael–Palestine',
  'Rape': 'ra*pe',
  'Rapes': 'ra*pes',
  'Rapist': 'Ra*pist',
  'Rapists': 'ra*pists',
  'Raped': 'Ra*ped',
  'Raping': 'ra*ping',
  'Gangrape': 'gangra*pe',
  'Gang-rape': 'gang-ra*pe',
  'Gangraped': 'gangra*ped',
  'Gang-raped': 'gang-ra*ped',
};

/**
 * Applies the case of the original string to the replacement string.
 */
const applyCase = (original: string, replacement: string): string => {
  // 1. All uppercase
  if (original === original.toUpperCase() && original !== original.toLowerCase()) {
    return replacement.toUpperCase();
  }

  // 2. All lowercase
  if (original === original.toLowerCase() && original !== original.toUpperCase()) {
    return replacement.toLowerCase();
  }

  // 3. Capitalized (First letter upper, rest lower)
  const startsWithUpper = original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase();
  const restIsLower = original.slice(1) === original.slice(1).toLowerCase();
  if (startsWithUpper && restIsLower) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1).toLowerCase();
  }

  // 4. Mixed case or other: character by character mapping
  let result = '';
  let originalIndex = 0;

  for (let i = 0; i < replacement.length; i++) {
    const replacementChar = replacement[i];
    if (/[a-zA-Z]/.test(replacementChar)) {
      if (originalIndex < original.length) {
        const originalChar = original[originalIndex];
        // Apply original char's case to replacement char
        if (originalChar === originalChar.toUpperCase() && originalChar !== originalChar.toLowerCase()) {
          result += replacementChar.toUpperCase();
        } else {
          result += replacementChar.toLowerCase();
        }
        originalIndex++;
      } else {
        result += replacementChar;
      }
    } else {
      result += replacementChar;
      // If replacement has a symbol, check if original also has one to stay in sync
      if (originalIndex < original.length && !/[a-zA-Z]/.test(original[originalIndex])) {
        originalIndex++;
      }
    }
  }
  return result;
};

// Internal cache for default mappings to optimize performance
let cachedDefaultRegex: RegExp | null = null;
let cachedLowerDefaultMappings: Record<string, string> | null = null;

/**
 * Censors restricted words in a text while preserving the original case.
 * Optimized to use a single-pass regex replacement.
 */
export const censorText = (text: string, customMappings?: Record<string, string>) => {
  if (!text) return text;

  const mappings = customMappings || defaultMappings;
  if (Object.keys(mappings).length === 0) return text;

  let regex: RegExp;
  let lowerMap: Record<string, string>;

  // Use cached regex and mapping if using default restricted words
  if (!customMappings && cachedDefaultRegex && cachedLowerDefaultMappings) {
    regex = cachedDefaultRegex;
    lowerMap = cachedLowerDefaultMappings;
  } else {
    // Sort keys by length descending to ensure longest matches are prioritized in the regex alternation
    const keys = Object.keys(mappings).sort((a, b) => b.length - a.length);
    // Escape special characters to safely use words in a regular expression
    const escapedKeys = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    // Use Unicode-aware word boundaries (lookarounds) to avoid partial word matches
    regex = new RegExp(`(?<!\\p{L})(?:${escapedKeys.join('|')})(?!\\p{L})`, 'giu');

    // Create a lowercase-keyed map for fast replacement lookup
    lowerMap = {};
    for (const [k, v] of Object.entries(mappings)) {
      lowerMap[k.toLowerCase()] = v;
    }

    // Cache the results for default mappings
    if (!customMappings) {
      cachedDefaultRegex = regex;
      cachedLowerDefaultMappings = lowerMap;
    }
  }

  // Single-pass replacement using the combined regex
  return text.replace(regex, (match) => {
    const template = lowerMap[match.toLowerCase()];
    if (!template) return match;
    return applyCase(match, template);
  });
};
