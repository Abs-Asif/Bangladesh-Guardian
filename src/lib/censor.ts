export const defaultMappings: Record<string, string> = {
  'Kill': 'k*ill',
  'Killing': 'ki*lling',
  'Killer': 'ki*ller',
  'Killed': 'ki*lled',
  'Suicide': 'Su*icide',
  'Gaza': 'Ga*za',
  'Murder': 'Mu*rder',
  'Murdered': 'Mu*rdered',
  'Murderer': 'Mu*rderer',
  'Israel': 'Isr*ael',
  'Israeli': 'Isr*aeli',
  'Rape': 'ra*pe',
  'Rapist': 'Ra*pist',
  'Raped': 'Ra*ped',
};

export const censorText = (text: string, customMappings?: Record<string, string>) => {
  if (!text) return text;
  let censored = text;
  const mappings = customMappings || defaultMappings;

  // Sort by length descending to match longer words first
  const sortedUnsafe = Object.keys(mappings).sort((a, b) => b.length - a.length);

  sortedUnsafe.forEach((unsafe) => {
    const regex = new RegExp(unsafe, 'gi');
    censored = censored.replace(regex, mappings[unsafe]);
  });
  return censored;
};
