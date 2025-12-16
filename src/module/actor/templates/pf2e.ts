import { ProficiencyLevel } from '../interfaces';

export interface PF2eActorAbility {
  mod: number;
}

export interface PF2eActorAbilities {
  str: PF2eActorAbility;
  dex: PF2eActorAbility;
  con: PF2eActorAbility;
  int: PF2eActorAbility;
  wis: PF2eActorAbility;
  cha: PF2eActorAbility;
}

export interface PF2eSaveData {
  value: number;
  rank: number; // 0 = untrained, 1 = trained, 2 = expert, 3 = master, 4 = legendary
}

export interface PF2eActorSaves {
  fortitude: PF2eSaveData;
  reflex: PF2eSaveData;
  will: PF2eSaveData;
}

export interface PF2eActorSkill {
  rank: number; // 0-4 for proficiency
  armor?: boolean;
}

export interface PF2eActorSkills {
  [key: string]: PF2eActorSkill;
}

export interface PF2eActorPerception {
  rank: number;
  value: number;
}

export interface PF2eActorAttributes {
  ac: {
    value: number;
  };
  hp: {
    value: number;
    max: number;
    temp: number;
  };
  speed: {
    value: number;
    otherSpeeds: Array<{
      type: string;
      value: number;
    }>;
  };
  perception: PF2eActorPerception;
}

export interface PF2eActorTraits {
  value: string[];
  size: {
    value: 'tiny' | 'sm' | 'med' | 'lg' | 'huge' | 'grg';
  };
  rarity?: string;
}

export interface PF2eActorDetails {
  level: {
    value: number;
  };
  languages: {
    value: string[];
  };
  biography?: string;
}

export interface PF2eImmunity {
  type: string;
  exceptions?: string[];
}

export interface PF2eResistance {
  type: string;
  value: number;
  exceptions?: string[];
  doubleVs?: string[];
}

export interface PF2eWeakness {
  type: string;
  value: number;
  exceptions?: string[];
}

export interface PF2eActorData {
  abilities: PF2eActorAbilities;
  attributes: PF2eActorAttributes;
  details: PF2eActorDetails;
  saves: PF2eActorSaves;
  skills: PF2eActorSkills;
  traits: PF2eActorTraits;
  resources?: {
    immunities?: PF2eImmunity[];
    resistances?: PF2eResistance[];
    weaknesses?: PF2eWeakness[];
  };
}

/**
 * Convert proficiency level to numeric rank
 * @param proficiency - The proficiency level
 * @returns Numeric rank (0-4)
 */
export function proficiencyToRank(proficiency: ProficiencyLevel): number {
  const rankMap: Record<ProficiencyLevel, number> = {
    untrained: 0,
    trained: 1,
    expert: 2,
    master: 3,
    legendary: 4,
  };
  return rankMap[proficiency];
}

/**
 * Convert size to PF2e size code
 * @param size - The size string
 * @returns PF2e size code
 */
export function convertSizeToPF2e(size: string): 'tiny' | 'sm' | 'med' | 'lg' | 'huge' | 'grg' {
  const sizeMap: Record<string, 'tiny' | 'sm' | 'med' | 'lg' | 'huge' | 'grg'> = {
    Tiny: 'tiny',
    Small: 'sm',
    Medium: 'med',
    Large: 'lg',
    Huge: 'huge',
    Gargantuan: 'grg',
  };
  return sizeMap[size] || 'med';
}

/**
 * PF2e skill name mapping to system keys
 */
export const PF2E_SKILL_MAP: Record<string, string> = {
  acrobatics: 'acr',
  arcana: 'arc',
  athletics: 'ath',
  crafting: 'cra',
  deception: 'dec',
  diplomacy: 'dip',
  intimidation: 'itm',
  lore: 'lore',
  medicine: 'med',
  nature: 'nat',
  occultism: 'occ',
  performance: 'prf',
  religion: 'rel',
  society: 'soc',
  stealth: 'ste',
  survival: 'sur',
  thievery: 'thi',
};
