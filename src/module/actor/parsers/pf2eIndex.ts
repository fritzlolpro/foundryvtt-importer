import {
  ImportPF2eActor,
  ImportPF2eActorParser,
  isPF2eAbilities,
  PF2eSaves,
  PF2eSkill,
  PF2eSpeeds,
  PF2eResistance,
  PF2eWeakness,
  PF2eFeature,
  PF2eStrike,
  ImportItems,
  Health,
  PF2ePerception,
} from '../interfaces';
import { ParseActorPF2e } from './pf2eTextBlock';

/**
 * Try to parse using a single PF2e parser
 */
export function trySinglePF2eActorParse(parser: ImportPF2eActorParser, lines: string[]): ImportPF2eActor {
  const errors: string[] = [];
  
  // Helper function to try parsers in sequence with error tracking
  function tryParser<T>(
    parsers: ((lines: string[]) => T)[],
    lines: string[],
    typeGuard: (value: unknown) => value is T,
    fieldName: string,
    options?: { isOptional?: boolean; defaultValue?: T },
  ): T {
    for (let i = 0; i < parsers.length; i++) {
      const parserFn = parsers[i];
      try {
        const result = parserFn(lines);
        if (typeGuard(result)) {
          return result;
        }
      } catch (e) {
        // Log error for debugging
        const errorMsg = e instanceof Error ? e.message : String(e);
        errors.push(`${fieldName} (parser ${i + 1}/${parsers.length}): ${errorMsg}`);
      }
    }
    
    if (options?.isOptional && options.defaultValue !== undefined) {
      return options.defaultValue;
    }
    
    const errorDetails = errors.filter(e => e.startsWith(fieldName)).join('\n  ');
    throw new Error(`Failed to parse ${fieldName}. Errors:\n  ${errorDetails}`);
  }
  
  // Type guards
  const isString = (value: unknown): value is string => typeof value === 'string';
  const isNumber = (value: unknown): value is number => typeof value === 'number' && !isNaN(value);
  const isStringArray = (value: unknown): value is string[] => Array.isArray(value);
  const isPF2eSkillArray = (value: unknown): value is PF2eSkill[] => Array.isArray(value);
  const isPF2eSaves = (value: unknown): value is PF2eSaves => 
    typeof value === 'object' && value !== null && 'fortitude' in value;
  const isPF2eSpeeds = (value: unknown): value is PF2eSpeeds => 
    typeof value === 'object' && value !== null;
  const isHealth = (value: unknown): value is Health => 
    typeof value === 'object' && value !== null && 'value' in value;
  const isPF2ePerception = (value: unknown): value is PF2ePerception => 
    typeof value === 'object' && value !== null && 'value' in value;
  const isPF2eResistanceArray = (value: unknown): value is PF2eResistance[] => Array.isArray(value);
  const isPF2eWeaknessArray = (value: unknown): value is PF2eWeakness[] => Array.isArray(value);
  const isPF2eFeatureArray = (value: unknown): value is PF2eFeature[] => Array.isArray(value);
  const isPF2eStrikeArray = (value: unknown): value is PF2eStrike[] => Array.isArray(value);
  const isImportItems = (value: unknown): value is ImportItems => Array.isArray(value);
  const isACType = (value: unknown): value is { value: number; proficiency?: any; type?: string } =>
    typeof value === 'object' && value !== null && 'value' in value;
  
  const abilities = tryParser(parser.parseAbilities, lines, isPF2eAbilities, 'abilities');
  
  return {
    name: tryParser(parser.parseName, lines, isString, 'name'),
    level: tryParser(parser.parseLevel, lines, isNumber, 'level'),
    size: tryParser(parser.parseSize, lines, (value): value is any => true, 'size'),
    traits: tryParser(parser.parseTraits, lines, isStringArray, 'traits', {
      isOptional: true,
      defaultValue: [],
    }),
    perception: tryParser(parser.parsePerception, lines, isPF2ePerception, 'perception'),
    languages: tryParser(parser.parseLanguages, lines, isStringArray, 'languages', {
      isOptional: true,
      defaultValue: [],
    }),
    abilities,
    saves: tryParser(parser.parseSaves, lines, isPF2eSaves, 'saves'),
    skills: tryParser(parser.parseSkills, lines, isPF2eSkillArray, 'skills', {
      isOptional: true,
      defaultValue: [],
    }),
    ac: tryParser(parser.parseAC, lines, isACType, 'ac'),
    health: tryParser(parser.parseHealth, lines, isHealth, 'health'),
    speeds: tryParser(parser.parseSpeeds, lines, isPF2eSpeeds, 'speeds', {
      isOptional: true,
      defaultValue: { walk: 30 },
    }),
    immunities: tryParser(parser.parseImmunities, lines, isStringArray, 'immunities', {
      isOptional: true,
      defaultValue: [],
    }),
    resistances: tryParser(parser.parseResistances, lines, isPF2eResistanceArray, 'resistances', {
      isOptional: true,
      defaultValue: [],
    }),
    weaknesses: tryParser(parser.parseWeaknesses, lines, isPF2eWeaknessArray, 'weaknesses', {
      isOptional: true,
      defaultValue: [],
    }),
    strikes: tryParser(parser.parseStrikes, lines, isPF2eStrikeArray, 'strikes', {
      isOptional: true,
      defaultValue: [],
    }),
    features: tryParser(parser.parseFeatures, lines, isPF2eFeatureArray, 'features', {
      isOptional: true,
      defaultValue: [],
    }),
    items: tryParser(parser.parseItems, lines, isImportItems, 'items', {
      isOptional: true,
      defaultValue: [],
    }),
  };
}

/**
 * Try multiple parsers until one succeeds
 */
export function tryPF2eActorParse(parsers: ImportPF2eActorParser[], lines: string[]): ImportPF2eActor {
  const allErrors: string[] = [];
  
  for (let i = 0; i < parsers.length; i++) {
    const parser = parsers[i];
    try {
      return trySinglePF2eActorParse(parser, lines);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      allErrors.push(`\n=== Parser ${i + 1}/${parsers.length} failed ===\n${errorMsg}`);
    }
  }
  
  // If we got here, all parsers failed - throw detailed error
  const detailedError = `Failed to parse PF2e actor. Tried ${parsers.length} parser(s):\n${allErrors.join('\n')}`;
  throw new Error(detailedError);
}

/**
 * Convert text to PF2e actor
 */
export function textToPF2eActor(input: string): ImportPF2eActor {
  const lines = input.split('\n');
  const availableParsers = [ParseActorPF2e];
  return tryPF2eActorParse(availableParsers, lines);
}
