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

export const censorText = (text: string, customMappings?: Record<string, string>) => {
  if (!text) return text;
  let censored = text;
  const mappings = customMappings || defaultMappings;

  // Sort by length descending to match longer words first
  const sortedUnsafe = Object.keys(mappings).sort((a, b) => b.length - a.length);

  sortedUnsafe.forEach((unsafe) => {
    const regex = new RegExp(unsafe, 'gi');
    censored = censored.replace(regex, (match) => applyCase(match, mappings[unsafe]));
  });
  return censored;
};
