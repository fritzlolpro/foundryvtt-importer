import { ImportItem } from '../item/interfaces';

export interface Ability {
  value: number;
  mod: number;
  savingThrow: number;
}

export type Languages = string[];

export interface Abilities {
  str: Ability;
  dex: Ability;
  con: Ability;
  int: Ability;
  wis: Ability;
  cha: Ability;
}

// For this type guard, we are okay with an any
// eslint-disable-next-line
export function isAbilities(obj: any): obj is Abilities {
  // make sure str.value, dex.value, etc. are all numbers (not NaN)
  const hasKeys = 'str' in obj && 'dex' in obj && 'con' in obj && 'int' in obj && 'wis' in obj && 'cha' in obj;
  if (!hasKeys) return false;
  if (
    isNaN(obj.str.value) ||
    isNaN(obj.dex.value) ||
    isNaN(obj.con.value) ||
    isNaN(obj.int.value) ||
    isNaN(obj.wis.value) ||
    isNaN(obj.cha.value)
  ) {
    return false;
  }
  return true;
}

export interface Skill {
  name: string;
  bonus: number;
}

export interface Group {
  name: string;
  collection: string[];
}

export interface ArmorClass {
  value: number;
  type: string;
}

export type SectionLabel = 'action' | 'bonus' | 'reaction' | 'legendary';
export interface Feature {
  name: string;
  description: string;
  section?: SectionLabel;
}

export type Features = Feature[];

export interface Health {
  value: number;
  min: number;
  max: number;
  formula?: string;
}

export interface Rating {
  cr?: number;
  xp: number;
}

export type DamageType =
  | 'poison'
  | 'disease'
  | 'magic'
  | 'psychic'
  | 'radiant'
  | 'necrotic'
  | 'bludgeoning'
  | 'piercing'
  | 'slashing'
  | 'acid'
  | 'cold'
  | 'fire'
  | 'force'
  | 'lightning'
  | 'necrotic'
  | 'psychic'
  | 'radiant'
  | 'thunder';
export type DamageTypes = DamageType[];

export type ConditionType =
  | 'blinded'
  | 'charmed'
  | 'deafened'
  | 'exhaustion'
  | 'frightened'
  | 'grappled'
  | 'incapacitated'
  | 'invisible'
  | 'paralyzed'
  | 'petrified'
  | 'poisoned'
  | 'prone'
  | 'restrained'
  | 'stunned'
  | 'unconscious';
export type ConditionTypes = ConditionType[];

export interface Senses {
  darkvision?: number;
  blindsight?: number;
  tremorsense?: number;
  truesight?: number;
  units: string;
  special?: string;
  passivePerception?: number;
}

export type Size = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan';

export type Name = string;
export type ActorType = string;
export type Alignment = string;
export type Biography = string;
export type Speed = number;
export type ImportItems = ImportItem[];
export interface ImportSpell {
  name: string;
  uses: {
    value?: number;
    max?: number;
    per?: string;
    atWill?: boolean;
  };
  type: 'spell';
}
export type ImportSpells = ImportSpell[];

export type ImportSpellcasting = string | undefined;

export type ActorTypes =
  | Name
  | ActorType
  | Alignment
  | Biography
  | Size
  | ConditionType
  | DamageType[]
  | Group
  | Languages
  | Rating
  | Senses
  | Abilities
  | Skill[]
  | ArmorClass
  | Feature[]
  | Rating
  | Speed
  | Health
  | ImportItems
  | ImportSpells
  | ImportSpellcasting;

export interface ImportActor {
  name: Name;
  size: Size;
  type: ActorType;
  alignment: Alignment;
  senses: Senses;
  languages: Languages;
  biography: Biography;
  damageImmunities: DamageTypes;
  damageResistances: DamageTypes;
  conditionImmunities: ConditionTypes;
  damageVulnerabilities: DamageTypes;
  health: Health;
  rating: Rating;
  armorClass: ArmorClass;
  abilities: Abilities;
  speed: Speed;
  skills: Skill[];
  items: ImportItems;
  spells: ImportSpells;
  spellcasting: ImportSpellcasting;
}

export interface ImportActorParser {
  parseName: ((lines: string[]) => Name)[];
  parseSize: ((lines: string[]) => Size)[];
  parseType: ((lines: string[]) => ActorType)[];
  parseAlignment: ((lines: string[]) => Alignment)[];
  parseSenses: ((lines: string[]) => Senses)[];
  parseLanguages: ((lines: string[]) => Languages)[];
  parseBiography: ((lines: string[]) => Biography)[];
  parseDamageImmunities: ((lines: string[]) => DamageTypes)[];
  parseDamageResistances: ((lines: string[]) => DamageTypes)[];
  parseConditionImmunities: ((lines: string[]) => ConditionTypes)[];
  parseDamageVulnerabilities: ((lines: string[]) => DamageTypes)[];
  parseHealth: ((lines: string[]) => Health)[];
  parseRating: ((lines: string[]) => Rating)[];
  parseArmorClass: ((lines: string[]) => ArmorClass)[];
  parseAbilities: ((lines: string[]) => Abilities)[];
  parseSpeed: ((lines: string[]) => Speed)[];
  parseSkills: ((lines: string[]) => Skill[])[];
  parseItems: ((lines: string[], abilities: Abilities) => ImportItems)[];
  parseSpells: ((lines: string[]) => ImportSpells)[];
  parseSpellcasting: ((lines: string[]) => ImportSpellcasting)[];
}

export interface Formula {
  value: number;
  str?: string;
  min?: number;
  max?: number;
  mod?: number;
  afterRegex?: string;
  beforeRegex?: string;
  afterFormula?: string;
  beforeFormula?: string;
}

// ============================================================================
// PF2e (Pathfinder 2e) Specific Interfaces
// ============================================================================

export type ProficiencyLevel = 'untrained' | 'trained' | 'expert' | 'master' | 'legendary';

export interface PF2eAbility {
  value: number;
  mod: number;
}

export interface PF2eAbilities {
  str: PF2eAbility;
  dex: PF2eAbility;
  con: PF2eAbility;
  int: PF2eAbility;
  wis: PF2eAbility;
  cha: PF2eAbility;
}

// Type guard for PF2eAbilities
// eslint-disable-next-line
export function isPF2eAbilities(obj: any): obj is PF2eAbilities {
  const hasKeys = 'str' in obj && 'dex' in obj && 'con' in obj && 'int' in obj && 'wis' in obj && 'cha' in obj;
  if (!hasKeys) return false;
  if (
    isNaN(obj.str.mod) ||
    isNaN(obj.dex.mod) ||
    isNaN(obj.con.mod) ||
    isNaN(obj.int.mod) ||
    isNaN(obj.wis.mod) ||
    isNaN(obj.cha.mod)
  ) {
    return false;
  }
  return true;
}

export interface PF2eSave {
  value: number;
  proficiency: ProficiencyLevel;
}

export interface PF2eSaves {
  fortitude: PF2eSave;
  reflex: PF2eSave;
  will: PF2eSave;
}

export interface PF2eSkill {
  name: string;
  bonus: number;
  proficiency: ProficiencyLevel;
}

export interface PF2ePerception {
  value: number;
  proficiency: ProficiencyLevel;
  special?: string;
}

export type ActionCost = 1 | 2 | 3 | 'reaction' | 'free' | 'passive';

export interface PF2eFeature {
  name: string;
  description: string;
  actionCost?: ActionCost;
  traits?: string[];
}

export interface PF2eStrike {
  name: string;
  description: string;
  attackBonus?: number;
  damage?: string;
  damageType?: string;
  traits?: string[];
}

export interface PF2eResistance {
  type: string;
  value?: number;
  exceptions?: string;
}

export interface PF2eWeakness {
  type: string;
  value: number;
}

export interface PF2eSpeeds {
  [key: string]: number;
}

export interface ImportPF2eActor {
  name: Name;
  level: number;
  size: Size;
  traits: string[];
  perception: PF2ePerception;
  languages: Languages;
  abilities: PF2eAbilities;
  saves: PF2eSaves;
  skills: PF2eSkill[];
  ac: {
    value: number;
    proficiency?: ProficiencyLevel;
    type?: string;
  };
  health: Health;
  speeds: PF2eSpeeds;
  immunities: string[];
  resistances: PF2eResistance[];
  weaknesses: PF2eWeakness[];
  features: PF2eFeature[];
  strikes: PF2eStrike[];
  items?: ImportItems;
}

export interface ImportPF2eActorParser {
  parseName: ((lines: string[]) => Name)[];
  parseLevel: ((lines: string[]) => number)[];
  parseSize: ((lines: string[]) => Size)[];
  parseTraits: ((lines: string[]) => string[])[];
  parsePerception: ((lines: string[]) => PF2ePerception)[];
  parseLanguages: ((lines: string[]) => Languages)[];
  parseAbilities: ((lines: string[]) => PF2eAbilities)[];
  parseSaves: ((lines: string[]) => PF2eSaves)[];
  parseSkills: ((lines: string[]) => PF2eSkill[])[];
  parseAC: ((lines: string[]) => { value: number; proficiency?: ProficiencyLevel; type?: string })[];
  parseHealth: ((lines: string[]) => Health)[];
  parseSpeeds: ((lines: string[]) => PF2eSpeeds)[];
  parseImmunities: ((lines: string[]) => string[])[];
  parseResistances: ((lines: string[]) => PF2eResistance[])[];
  parseWeaknesses: ((lines: string[]) => PF2eWeakness[])[];
  parseStrikes: ((lines: string[]) => PF2eStrike[])[];
  parseFeatures: ((lines: string[]) => PF2eFeature[])[];
  parseItems: ((lines: string[]) => ImportItems)[];
}
