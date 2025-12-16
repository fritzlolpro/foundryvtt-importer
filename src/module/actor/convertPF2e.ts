import {
  ImportPF2eActor,
  PF2eAbilities,
  PF2eSaves,
  PF2eSkill,
  PF2eSpeeds,
  PF2eResistance,
  PF2eWeakness,
} from './interfaces';
import {
  PF2eActorData,
  PF2eActorAbilities,
  PF2eActorSaves,
  PF2eActorSkills,
  PF2eActorPerception,
  PF2eActorAttributes,
  PF2eActorDetails,
  PF2eActorTraits,
  proficiencyToRank,
  convertSizeToPF2e,
  PF2E_SKILL_MAP,
  PF2eResistance as PF2eActorResistance,
  PF2eWeakness as PF2eActorWeakness,
  PF2eImmunity,
} from './templates/pf2e';

/**
 * Convert PF2e abilities to Foundry format
 */
export function convertAbilitiesPF2e(abilities: PF2eAbilities): PF2eActorAbilities {
  return {
    str: { mod: abilities.str.mod },
    dex: { mod: abilities.dex.mod },
    con: { mod: abilities.con.mod },
    int: { mod: abilities.int.mod },
    wis: { mod: abilities.wis.mod },
    cha: { mod: abilities.cha.mod },
  };
}

/**
 * Convert PF2e saves to Foundry format
 */
export function convertSavesPF2e(saves: PF2eSaves): PF2eActorSaves {
  return {
    fortitude: {
      value: saves.fortitude.value,
      rank: proficiencyToRank(saves.fortitude.proficiency),
    },
    reflex: {
      value: saves.reflex.value,
      rank: proficiencyToRank(saves.reflex.proficiency),
    },
    will: {
      value: saves.will.value,
      rank: proficiencyToRank(saves.will.proficiency),
    },
  };
}

/**
 * Convert PF2e skills to Foundry format
 */
export function convertSkillsPF2e(skills: PF2eSkill[]): PF2eActorSkills {
  const foundrySkills: PF2eActorSkills = {};
  
  for (const skill of skills) {
    const skillName = skill.name.toLowerCase();
    const skillKey = PF2E_SKILL_MAP[skillName];
    
    if (skillKey) {
      foundrySkills[skillKey] = {
        rank: proficiencyToRank(skill.proficiency),
      };
    } else {
      // Handle custom skills (like lore)
      foundrySkills[skillName] = {
        rank: proficiencyToRank(skill.proficiency),
      };
    }
  }
  
  return foundrySkills;
}

/**
 * Convert perception to Foundry format
 */
export function convertPerceptionPF2e(
  perception: ImportPF2eActor['perception'],
): PF2eActorPerception {
  return {
    value: perception.value,
    rank: proficiencyToRank(perception.proficiency),
  };
}

/**
 * Convert speeds to Foundry format
 */
export function convertSpeedsPF2e(speeds: PF2eSpeeds): {
  value: number;
  otherSpeeds: Array<{ type: string; value: number }>;
} {
  const walkSpeed = speeds.walk || 30;
  const otherSpeeds: Array<{ type: string; value: number }> = [];
  
  for (const [type, value] of Object.entries(speeds)) {
    if (type !== 'walk') {
      otherSpeeds.push({ type, value });
    }
  }
  
  return {
    value: walkSpeed,
    otherSpeeds,
  };
}

/**
 * Convert attributes to Foundry format
 */
export function convertAttributesPF2e(actor: ImportPF2eActor): PF2eActorAttributes {
  const speedData = convertSpeedsPF2e(actor.speeds);
  
  return {
    ac: {
      value: actor.ac.value,
    },
    hp: {
      value: actor.health.value,
      max: actor.health.max,
      temp: 0,
    },
    speed: speedData,
    perception: convertPerceptionPF2e(actor.perception),
  };
}

/**
 * Convert details to Foundry format
 */
export function convertDetailsPF2e(actor: ImportPF2eActor): PF2eActorDetails {
  return {
    level: {
      value: actor.level,
    },
    languages: {
      value: actor.languages,
    },
  };
}

/**
 * Convert traits to Foundry format
 */
export function convertTraitsPF2e(actor: ImportPF2eActor): PF2eActorTraits {
  return {
    value: actor.traits,
    size: {
      value: convertSizeToPF2e(actor.size),
    },
  };
}

/**
 * Convert immunities to Foundry format
 */
export function convertImmunitiesPF2e(immunities: string[]): PF2eImmunity[] {
  return immunities.map((immunity) => ({
    type: immunity,
  }));
}

/**
 * Convert resistances to Foundry format
 */
export function convertResistancesPF2e(resistances: PF2eResistance[]): PF2eActorResistance[] {
  return resistances.map((resistance) => ({
    type: resistance.type,
    value: resistance.value || 0,
    exceptions: resistance.exceptions ? [resistance.exceptions] : undefined,
  }));
}

/**
 * Convert weaknesses to Foundry format
 */
export function convertWeaknessesPF2e(weaknesses: PF2eWeakness[]): PF2eActorWeakness[] {
  return weaknesses.map((weakness) => ({
    type: weakness.type,
    value: weakness.value,
  }));
}

/**
 * Main conversion function from ImportPF2eActor to Foundry PF2e format
 */
export function actorToPF2e(actor: ImportPF2eActor): PF2eActorData {
  return {
    abilities: convertAbilitiesPF2e(actor.abilities),
    attributes: convertAttributesPF2e(actor),
    details: convertDetailsPF2e(actor),
    saves: convertSavesPF2e(actor.saves),
    skills: convertSkillsPF2e(actor.skills),
    traits: convertTraitsPF2e(actor),
    resources: {
      immunities: convertImmunitiesPF2e(actor.immunities),
      resistances: convertResistancesPF2e(actor.resistances),
      weaknesses: convertWeaknessesPF2e(actor.weaknesses),
    },
  };
}
