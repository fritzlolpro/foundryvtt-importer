import {
  ImportPF2eActorParser,
  Name,
  Size,
  Languages,
  Health,
  PF2eAbilities,
  PF2eSaves,
  PF2eSkill,
  PF2ePerception,
  PF2eSpeeds,
  PF2eResistance,
  PF2eWeakness,
  PF2eFeature,
  PF2eStrike,
  ImportItems,
  ProficiencyLevel,
  ActionCost,
} from '../interfaces';
import { parseGenericFormula } from './generic';

export const ParseActorPF2e: ImportPF2eActorParser = {
  parseName: [parseNamePF2e, parseSimpleNamePF2e, parseCompanionNamePF2e],
  parseLevel: [parseLevelPF2e, parseSimpleLevelPF2e, parseCompanionLevelPF2e],
  parseSize: [parseSizePF2e, parseSizeFromTraitsLine, parseSizeFromAlignmentLine],
  parseTraits: [parseTraitsPF2e, parseTraitsFromAlignmentLine],
  parsePerception: [parsePerceptionPF2e],
  parseLanguages: [parseLanguagesPF2e],
  parseAbilities: [parseAbilitiesPF2e],
  parseSaves: [parseSavesPF2e],
  parseSkills: [parseSkillsPF2e, parseSkillSingularPF2e],
  parseAC: [parseACPF2e],
  parseHealth: [parseHealthPF2e],
  parseSpeeds: [parseSpeedsPF2e, parseSimpleSpeedPF2e],
  parseImmunities: [parseImmunitiesPF2e],
  parseResistances: [parseResistancesPF2e],
  parseWeaknesses: [parseWeaknessesPF2e],
  parseStrikes: [parseStrikesPF2e],
  parseFeatures: [parseFeaturesPF2e],
  parseItems: [parseItemsPF2e],
};

/**
 * Parse creature name and level from first line
 * Format: "Phantasmal Minion       Creature -1" or "Test simple creature 0"
 * The word "Creature" (case-insensitive) followed by a number indicates the creature level
 */
export function parseNamePF2e(lines: string[]): Name {
  const firstLine = lines[0];
  if (!firstLine) throw new Error('Could not find name line');
  
  // Remove "Creature X" part - must be at end with spaces before
  // Matches both "Name    Creature 5" and "Name creature 0"
  const match = firstLine.match(/^(.+?)\s+Creature\s+([-\d]+)\s*$/i);
  if (!match) throw new Error('Could not find "Name Creature Level" pattern in: ' + firstLine);
  
  const name = match[1].trim();
  if (!name) throw new Error('Could not parse name');
  
  return name;
}

/**
 * Parse simple name (alternative format without "Creature" keyword)
 * Format: "Test Simple Monster 5" (where 5 is just a trailing number, not "Creature 5")
 * This is a fallback parser for non-standard formats
 */
export function parseSimpleNamePF2e(lines: string[]): Name {
  const firstLine = lines[0];
  if (!firstLine) throw new Error('Empty input - could not find name line');
  
  // Extract name and level separately
  // Match "Name Number" where Number is the level at the end
  const match = firstLine.match(/^(.+?)\s+([-\d]+)\s*$/i);
  if (!match) throw new Error('Could not find "Name Level" pattern in line: ' + firstLine);
  
  const name = match[1].trim();
  if (!name) throw new Error('Could not parse name from line: ' + firstLine);
  
  return name;
}

/**
 * Parse creature level from first line
 * Format: "Phantasmal Minion       Creature -1"
 */
export function parseLevelPF2e(lines: string[]): number {
  const firstLine = lines[0];
  if (!firstLine) throw new Error('Empty input - could not find level line');
  
  const levelMatch = firstLine.match(/Creature\s+([-\d]+)/i);
  if (!levelMatch) throw new Error('Could not find "Creature X" pattern in: ' + firstLine);
  
  return parseInt(levelMatch[1], 10);
}

/**
 * Parse simple level (just trailing number)
 * Format: "Test Simple Creature 0"
 */
export function parseSimpleLevelPF2e(lines: string[]): number {
  const firstLine = lines[0];
  if (!firstLine) throw new Error('Empty input - could not find level line');
  
  const levelMatch = firstLine.match(/([-\d]+)\s*$/i);
  if (!levelMatch) throw new Error('Could not find level number at end of line: ' + firstLine);
  
  return parseInt(levelMatch[1], 10);
}

/**
 * Parse companion level (no level in stat block, default to 0)
 * Format: "PRECIOUS" (companions don't have explicit level)
 */
export function parseCompanionLevelPF2e(lines: string[]): number {
  // Companions typically don't have a level in their stat block
  // Return 0 as default
  return 0;
}

/**
 * Parse companion name (just first line without level)
 * Format: "PRECIOUS"
 */
export function parseCompanionNamePF2e(lines: string[]): Name {
  const firstLine = lines[0];
  if (!firstLine) throw new Error('Empty input - could not find name line');
  
  const name = firstLine.trim();
  if (!name) throw new Error('Could not parse name from empty line');
  
  return name;
}

/**
 * Parse size from second line (first word)
 * Format: "Medium Force Mindless"
 */
export function parseSizePF2e(lines: string[]): Size {
  const sizeLine = lines[1];
  if (!sizeLine) throw new Error('Could not find size line (line 2)');
  
  const firstWord = sizeLine.trim().split(/\s+/)[0];
  const sizeMap: Record<string, Size> = {
    tiny: 'Tiny',
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    huge: 'Huge',
    gargantuan: 'Gargantuan',
  };
  
  const size = sizeMap[firstWord.toLowerCase()];
  if (!size) throw new Error(`Could not parse size from first word "${firstWord}" in line: ${sizeLine}`);
  
  return size;
}

/**
 * Parse size from traits line (handles formats like "n medium humanoid")
 * Format: "n medium humanoid" or "medium humanoid"
 */
export function parseSizeFromTraitsLine(lines: string[]): Size {
  const traitsLine = lines[1];
  if (!traitsLine) throw new Error('Could not find traits line (line 2)');
  
  const words = traitsLine.trim().toLowerCase().split(/\s+/);
  const sizeMap: Record<string, Size> = {
    tiny: 'Tiny',
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    huge: 'Huge',
    gargantuan: 'Gargantuan',
  };
  
  // Look for size keyword in any position
  for (const word of words) {
    if (sizeMap[word]) {
      return sizeMap[word];
    }
  }
  
  throw new Error(`Could not find size keyword (tiny/small/medium/large/huge/gargantuan) in line: ${traitsLine}`);
}

/**
 * Parse size from alignment line (companion format)
 * Format: "N SMALL CAT" (alignment + size + traits)
 */
export function parseSizeFromAlignmentLine(lines: string[]): Size {
  const alignmentLine = lines[1];
  if (!alignmentLine) throw new Error('Could not find alignment/size line (line 2)');
  
  const words = alignmentLine.trim().split(/\s+/);
  const sizeMap: Record<string, Size> = {
    tiny: 'Tiny',
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    huge: 'Huge',
    gargantuan: 'Gargantuan',
  };
  
  // Look for size keyword (usually second word after alignment)
  for (const word of words) {
    const normalized = word.toLowerCase();
    if (sizeMap[normalized]) {
      return sizeMap[normalized];
    }
  }
  
  throw new Error(`Could not find size in alignment line: ${alignmentLine}`);
}

/**
 * Parse traits from second line (everything after size)
 * Format: "Medium Force Mindless" -> ["Force", "Mindless"]
 * Or "N LARGE ANIMAL" -> ["Animal"]
 */
export function parseTraitsPF2e(lines: string[]): string[] {
  const traitsLine = lines[1];
  if (!traitsLine) throw new Error('Could not find traits line');
  
  const parts = traitsLine.trim().split(/\s+/);
  // Remove first word (size)
  parts.shift();
  
  // Convert each trait to title case
  return parts
    .filter((t) => t.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

/**
 * Parse traits from alignment line (companion format)
 * Format: "N SMALL CAT" -> ["Cat"]
 * Skip alignment (first word) and size (second word)
 */
export function parseTraitsFromAlignmentLine(lines: string[]): string[] {
  const alignmentLine = lines[1];
  if (!alignmentLine) return [];
  
  const words = alignmentLine.trim().split(/\s+/);
  
  // Skip first word (alignment like N, LG, CE, etc.)
  // Skip size words (tiny, small, medium, large, huge, gargantuan)
  const sizeWords = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];
  const traits: string[] = [];
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    if (!sizeWords.includes(word.toLowerCase())) {
      // Convert to title case: first letter uppercase, rest lowercase
      const titleCase = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      traits.push(titleCase);
    }
  }
  
  return traits;
}

/**
 * Parse perception
 * Format: "Perception +0; darkvision" or "Perception +8"
 */
export function parsePerceptionPF2e(lines: string[]): PF2ePerception {
  const perceptionLine = lines.find((line) => line.match(/^Perception\s+/i));
  if (!perceptionLine) throw new Error('Could not find perception line');
  
  const match = perceptionLine.match(/Perception\s+([-+]?\d+)/i);
  if (!match) throw new Error('Could not parse perception');
  
  const value = parseInt(match[1], 10);
  
  // Try to extract special senses
  const specialMatch = perceptionLine.match(/;\s*(.+)/i);
  const special = specialMatch ? specialMatch[1].trim() : undefined;
  
  return {
    value,
    proficiency: 'trained', // Default, may need adjustment
    special,
  };
}

/**
 * Parse languages
 * Format: "Languages Common, Draconic" or "Languages none"
 */
export function parseLanguagesPF2e(lines: string[]): Languages {
  const langLine = lines.find((line) => line.match(/^Languages\s+/i));
  if (!langLine) return [];
  
  const langText = langLine.replace(/^Languages\s+/i, '').trim();
  if (langText.toLowerCase() === 'none') return [];
  
  return langText.split(',').map((lang) => lang.trim());
}

/**
 * Parse abilities
 * Format: "Str -4, Dex +2, Con +0, Int -5, Wis +0, Cha +0"
 */
export function parseAbilitiesPF2e(lines: string[]): PF2eAbilities {
  const abilityLine = lines.find((line) => line.match(/Str\s+[-+]?\d+/i))?.replace('–', '-');
  if (!abilityLine) throw new Error('Could not find abilities line');
  
  const parseAbility = (abilityName: string): number => {
    const regex = new RegExp(`${abilityName}\\s+([-+]?\\d+)`, 'i');
    const match = abilityLine.match(regex);
    if (!match) throw new Error(`Could not parse ${abilityName}`);
    return parseInt(match[1], 10);
  };
  
  const str = parseAbility('Str');
  const dex = parseAbility('Dex');
  const con = parseAbility('Con');
  const int = parseAbility('Int');
  const wis = parseAbility('Wis');
  const cha = parseAbility('Cha');
  
  return {
    str: { value: 10 + str * 2, mod: str },
    dex: { value: 10 + dex * 2, mod: dex },
    con: { value: 10 + con * 2, mod: con },
    int: { value: 10 + int * 2, mod: int },
    wis: { value: 10 + wis * 2, mod: wis },
    cha: { value: 10 + cha * 2, mod: cha },
  };
}

/**
 * Parse skills
 * Format: "Skills Stealth +8"
 */
export function parseSkillsPF2e(lines: string[]): PF2eSkill[] {
  const skillLine = lines.find((line) => line.match(/^Skills\s+/i));
  if (!skillLine) throw new Error('Could not find "Skills" line');
  
  const skillText = skillLine.replace(/^Skills\s+/i, '').trim();
  const skillPairs = skillText.split(',');
  
  const skills: PF2eSkill[] = [];
  for (const pair of skillPairs) {
    const match = pair.trim().match(/([A-Za-z\s]+)\s+([-+]?\d+)/i);
    if (match) {
      skills.push({
        name: match[1].trim(),
        bonus: parseInt(match[2], 10),
        proficiency: 'trained', // Default
      });
    }
  }
  
  return skills;
}

/**
 * Parse skills (singular form for companions)
 * Format: "Skill Acrobatics +6, Athletics +5"
 */
export function parseSkillSingularPF2e(lines: string[]): PF2eSkill[] {
  const skillLine = lines.find((line) => line.match(/^Skill\s+/i));
  if (!skillLine) throw new Error('Could not find "Skill" line');
  
  const skillText = skillLine.replace(/^Skill\s+/i, '').trim();
  const skillPairs = skillText.split(',');
  
  const skills: PF2eSkill[] = [];
  for (const pair of skillPairs) {
    const match = pair.trim().match(/([A-Za-z\s]+)\s+([-+]?\d+)/i);
    if (match) {
      skills.push({
        name: match[1].trim(),
        bonus: parseInt(match[2], 10),
        proficiency: 'trained', // Default
      });
    }
  }
  
  return skills;
}

/**
 * Parse saves
 * Format: "AC 13; Fort +0, Ref +4, Will +0"
 */
export function parseSavesPF2e(lines: string[]): PF2eSaves {
  const saveLine = lines.find((line) => line.match(/Fort\s+[-+]?\d+/i));
  if (!saveLine) throw new Error('Could not find saves line');
  
  const parseSave = (saveName: string): number => {
    const regex = new RegExp(`${saveName}\\s+([-+]?\\d+)`, 'i');
    const match = saveLine.match(regex);
    if (!match) throw new Error(`Could not parse ${saveName}`);
    return parseInt(match[1], 10);
  };
  
  return {
    fortitude: {
      value: parseSave('Fort'),
      proficiency: 'trained', // Default
    },
    reflex: {
      value: parseSave('Ref'),
      proficiency: 'trained',
    },
    will: {
      value: parseSave('Will'),
      proficiency: 'trained',
    },
  };
}

/**
 * Parse AC
 * Format: "AC 13; Fort +0, Ref +4, Will +0"
 */
export function parseACPF2e(lines: string[]): { value: number; proficiency?: ProficiencyLevel; type?: string } {
  const acLine = lines.find((line) => line.match(/^AC\s+\d+/i));
  if (!acLine) throw new Error('Could not find AC line');
  
  const match = acLine.match(/AC\s+(\d+)/i);
  if (!match) throw new Error('Could not parse AC');
  
  return {
    value: parseInt(match[1], 10),
    proficiency: 'trained',
  };
}

/**
 * Parse HP
 * Format: "HP 4; Immunities disease..." or "HP 52 (8d8 + 16)"
 */
export function parseHealthPF2e(lines: string[]): Health {
  const hpLine = lines.find((line) => line.match(/^HP\s+\d+/i));
  if (!hpLine) throw new Error('Could not find HP line');
  
  const parsed = parseGenericFormula(hpLine.toLowerCase(), /hp\s+(.*)/);
  const { value, str } = parsed;
  
  return {
    value: value || 0,
    min: 0,
    max: value || 0,
    formula: str,
  };
}

/**
 * Parse speeds
 * Format: "Speed fly 30 feet" or "Speed 25 feet, fly 30 feet"
 */
export function parseSpeedsPF2e(lines: string[]): PF2eSpeeds {
  const speedLine = lines.find((line) => line.match(/^Speed\s+/i));
  if (!speedLine) return { walk: 30 };
  
  const speedText = speedLine.replace(/^Speed\s+/i, '').trim();
  const speeds: PF2eSpeeds = {};
  
  // Match pattern like "25 feet" or "fly 30 feet"
  const speedRegex = /(?:(\w+)\s+)?(\d+)\s*(?:feet|ft)/gi;
  let match;
  
  while ((match = speedRegex.exec(speedText)) !== null) {
    const speedType = match[1] ? match[1].toLowerCase() : 'walk';
    const speedValue = parseInt(match[2], 10);
    speeds[speedType] = speedValue;
  }
  
  // If no walk speed, default to 30
  if (!speeds.walk) {
    speeds.walk = 30;
  }
  
  return speeds;
}

/**
 * Parse simple speed (companions)
 * Format: "Speed 35 feet" (just one number, defaults to land speed)
 */
export function parseSimpleSpeedPF2e(lines: string[]): PF2eSpeeds {
  const speedLine = lines.find((line) => line.match(/^Speed\s+/i));
  if (!speedLine) throw new Error('Could not find Speed line');
  
  // Match "Speed 35 feet" or "Speed 35"
  const match = speedLine.match(/Speed\s+(\d+)\s*(?:feet)?/i);
  if (!match) throw new Error(`Could not parse speed from line: ${speedLine}`);
  
  const speedValue = parseInt(match[1], 10);
  return { land: speedValue };
}

/**
 * Parse immunities
 * Format: "HP 4; Immunities disease, mental, non-magical attacks..."
 */
export function parseImmunitiesPF2e(lines: string[]): string[] {
  const immuneLine = lines.find((line) => line.match(/Immunities\s+/i));
  if (!immuneLine) return [];
  
  const match = immuneLine.match(/Immunities\s+([^;]+)/i);
  if (!match) return [];
  
  return match[1]
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Parse resistances
 * Format: "Resistances all damage 5 (except force or ghost touch)"
 */
export function parseResistancesPF2e(lines: string[]): PF2eResistance[] {
  const resistLine = lines.find((line) => line.match(/Resistances\s+/i));
  if (!resistLine) return [];
  
  const match = resistLine.match(/Resistances\s+([^;]+)/i);
  if (!match) return [];
  
  const resistText = match[1].trim();
  const resistances: PF2eResistance[] = [];
  
  // Simple parsing: "type value" or "type value (exceptions)"
  const resistRegex = /([a-z\s]+)\s+(\d+)(?:\s*\(([^)]+)\))?/gi;
  let resistMatch;
  
  while ((resistMatch = resistRegex.exec(resistText)) !== null) {
    resistances.push({
      type: resistMatch[1].trim(),
      value: parseInt(resistMatch[2], 10),
      exceptions: resistMatch[3] ? resistMatch[3].trim() : undefined,
    });
  }
  
  return resistances;
}

/**
 * Parse weaknesses
 * Format: "Weaknesses cold iron 5, good 5"
 */
export function parseWeaknessesPF2e(lines: string[]): PF2eWeakness[] {
  const weakLine = lines.find((line) => line.match(/Weaknesses\s+/i));
  if (!weakLine) return [];
  
  const match = weakLine.match(/Weaknesses\s+([^;]+)/i);
  if (!match) return [];
  
  const weakText = match[1].trim();
  const weaknesses: PF2eWeakness[] = [];
  
  // Parse "type value" pairs
  const weakRegex = /([a-z\s]+)\s+(\d+)/gi;
  let weakMatch;
  
  while ((weakMatch = weakRegex.exec(weakText)) !== null) {
    weaknesses.push({
      type: weakMatch[1].trim(),
      value: parseInt(weakMatch[2], 10),
    });
  }
  
  return weaknesses;
}

/**
 * Parse strikes/attacks
 * Format: "Melee [one-action] jaws +10, Damage 1d10+4 piercing plus Grab"
 * Format: "Ranged shortbow +7 (deadly d10), Damage 1d6 piercing"
 */
export function parseStrikesPF2e(lines: string[]): PF2eStrike[] {
  const strikes: PF2eStrike[] = [];
  
  for (const line of lines) {
    // Match Melee or Ranged attacks
    const strikeMatch = line.match(/^(Melee|Ranged)\s+\[([^\]]+)\]\s+(.+)/i);
    if (!strikeMatch) continue;
    
    const strikeType = strikeMatch[1]; // Melee or Ranged
    const actionCost = strikeMatch[2]; // one-action, two-actions, etc.
    const details = strikeMatch[3];
    
    // Parse: "jaws +10 (traits), Damage 1d10+4 piercing plus Grab"
    // or: "jaws +10, Damage 1d10+4 piercing plus Grab"
    const nameAndBonus = details.split(',')[0]; // "jaws +10 (traits)" or "jaws +10"
    
    // Extract name
    const nameMatch = nameAndBonus.match(/^([^+]+)/);
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown';
    
    // Extract attack bonus
    const bonusMatch = nameAndBonus.match(/\+(\d+)/);
    const attackBonus = bonusMatch ? parseInt(bonusMatch[1], 10) : undefined;
    
    // Extract traits (optional, in parentheses)
    const traitsMatch = nameAndBonus.match(/\(([^)]+)\)/);
    const traits = traitsMatch 
      ? traitsMatch[1].split(',').map(t => t.trim())
      : [];
    
    // Extract damage
    const damageMatch = details.match(/Damage\s+([^,]+)/i);
    let damage: string | undefined;
    let damageType: string | undefined;
    
    if (damageMatch) {
      const damageText = damageMatch[1].trim();
      // Parse "1d10+4 piercing plus Grab"
      const damageParts = damageText.match(/^([\dd+\s-]+)\s+(\w+)/);
      if (damageParts) {
        damage = damageParts[1].trim();
        damageType = damageParts[2].trim();
      } else {
        damage = damageText;
      }
    }
    
    strikes.push({
      name: `${strikeType}: ${name}`,
      description: line,
      attackBonus,
      damage,
      damageType,
      traits: traits.length > 0 ? traits : undefined,
    });
  }
  
  return strikes;
}

/**
 * Parse features/abilities
 * Formats:
 * - "Deep Breath The crocodile can hold..." (passive, between abilities and AC)
 * - "Aquatic Ambush [one-action] When hiding..." (active, after HP)
 * - "Grab [one-action] After succeeding..." (active, after HP)
 */
export function parseFeaturesPF2e(lines: string[]): PF2eFeature[] {
  const features: PF2eFeature[] = [];
  
  // Find where abilities end (last line starting with "Str" or abilities line)
  let abilitiesEndIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/Str\s+[-+]?\d+/i)) {
      abilitiesEndIndex = i;
      break;
    }
  }
  
  if (abilitiesEndIndex === -1) return [];
  
  // Features can appear:
  // 1. Between abilities and AC (passive features)
  // 2. After HP line (active features, actions)
  let currentFeature: { name: string; lines: string[] } | null = null;
  
  for (let i = abilitiesEndIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Skip stat lines (AC, HP, Speed, etc.)
    const isStatLine = line.match(/^(AC|HP|Speed|Fort|Ref|Will|Immunities|Resistances|Weaknesses)\s+/i);
    if (isStatLine) continue;
    
    // Also check for Melee/Ranged (those are strikes, not features)
    const isStrike = line.match(/^(Melee|Ranged)\s+/i);
    if (isStrike) continue;
    
    // Check if this is a new feature
    // Pattern 1: "Feature Name [one-action] description"
    // Pattern 2: "Feature Name description" (no action cost)
    // Features always start with uppercase letter
    const startsWithCapital = /^[A-Z]/.test(line);
    
    if (startsWithCapital && !isStrike) {
      // This might be a new feature
      // Save previous feature if exists
      if (currentFeature) {
        const description = currentFeature.lines.join(' ');
        const actionMatch = description.match(/\[([^\]]+)\]/);
        let actionCost: ActionCost | undefined;
        
        if (actionMatch) {
          const action = actionMatch[1].toLowerCase();
          if (action.includes('one-action')) actionCost = 1;
          else if (action.includes('two-action')) actionCost = 2;
          else if (action.includes('three-action')) actionCost = 3;
          else if (action.includes('reaction')) actionCost = 'reaction';
          else if (action.includes('free')) actionCost = 'free';
        }
        
        // Extract traits from parentheses
        const traitsMatch = description.match(/\(([^)]+)\)/);
        const traits = traitsMatch 
          ? traitsMatch[1].split(',').map(t => t.trim())
          : undefined;
        
        features.push({
          name: currentFeature.name,
          description,
          actionCost,
          traits,
        });
      }
      
      // Start new feature - extract name
      // Name is everything before the first [action] or before the description starts
      let name: string;
      const actionBracketMatch = line.match(/^([^[]+)\s*\[/);
      if (actionBracketMatch) {
        // Has action cost like "Aquatic Ambush [one-action]"
        name = actionBracketMatch[1].trim();
      } else {
        // No action cost - name is the first few capitalized words
        // "Deep Breath The crocodile..." -> "Deep Breath"
        // Look for pattern: "Capitalized Words" followed by article/pronoun/lowercase start
        const wordsMatch = line.match(/^([A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*)*)\s+(?:The|the|A|a|An|an|When|when|After|after|If|if|It|it|This|this)/);
        if (wordsMatch) {
          name = wordsMatch[1].trim();
        } else {
          // Fallback: take words until we hit lowercase or description
          const words = line.split(/\s+/);
          let nameWords: string[] = [];
          for (const word of words) {
            if (/^[A-Z]/.test(word)) {
              nameWords.push(word);
            } else {
              break;
            }
          }
          name = nameWords.length > 0 ? nameWords.join(' ') : words[0];
        }
      }
      
      currentFeature = {
        name,
        lines: [line],
      };
    } else if (currentFeature && !isStrike) {
      // Continue current feature (multiline description)
      currentFeature.lines.push(line);
    }
  }
  
  // Save last feature
  if (currentFeature) {
    const description = currentFeature.lines.join(' ');
    const actionMatch = description.match(/\[([^\]]+)\]/);
    let actionCost: ActionCost | undefined;
    
    if (actionMatch) {
      const action = actionMatch[1].toLowerCase();
      if (action.includes('one-action')) actionCost = 1;
      else if (action.includes('two-action')) actionCost = 2;
      else if (action.includes('three-action')) actionCost = 3;
      else if (action.includes('reaction')) actionCost = 'reaction';
      else if (action.includes('free')) actionCost = 'free';
    }
    
    const traitsMatch = description.match(/\(([^)]+)\)/);
    const traits = traitsMatch 
      ? traitsMatch[1].split(',').map(t => t.trim())
      : undefined;
    
    features.push({
      name: currentFeature.name,
      description,
      actionCost,
      traits,
    });
  }
  
  return features;
}

/**
 * Parse items (placeholder)
 */
export function parseItemsPF2e(lines: string[]): ImportItems {
  // Items parsing can be added later
  return [];
}
