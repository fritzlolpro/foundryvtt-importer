import { PF2eStrike, PF2eFeature } from '../actor/interfaces';

/**
 * PF2e Item structure for Foundry VTT
 * Based on the PF2e system's item schema
 */
export interface PF2eItem {
  name: string;
  type: string;
  img?: string;
  system: {
    description?: {
      value: string;
    };
    actions?: {
      value: number | null;
    };
    actionType?: {
      value: string; // 'action', 'reaction', 'free', 'passive'
    };
    traits?: {
      value: string[];
    };
    attack?: {
      value: string;
    };
    damageRolls?: {
      [key: string]: {
        damage: string;
        damageType: string;
      };
    };
    bonus?: {
      value: number;
    };
    weaponType?: {
      value: string; // 'melee' or 'ranged'
    };
  };
}

/**
 * Convert action cost to Foundry PF2e format
 */
function convertActionCost(actionCost?: number | 'reaction' | 'free' | 'passive'): {
  value: number | null;
  type: string;
} {
  if (actionCost === 'reaction') {
    return { value: null, type: 'reaction' };
  } else if (actionCost === 'free') {
    return { value: null, type: 'free' };
  } else if (actionCost === 'passive' || actionCost === undefined) {
    return { value: null, type: 'passive' };
  } else {
    return { value: actionCost, type: 'action' };
  }
}

/**
 * Convert a PF2e Strike to a Foundry Item
 * Strikes are weapon attacks (melee/ranged)
 */
export function strikeToItem(strike: PF2eStrike): PF2eItem {
  const actionInfo = convertActionCost(1); // Strikes are typically 1 action

  // Parse damage and damage type
  const damageRolls: any = {};
  if (strike.damage && strike.damageType) {
    damageRolls['0'] = {
      damage: strike.damage,
      damageType: strike.damageType,
    };
  }

  return {
    name: strike.name,
    type: 'melee', // PF2e system uses 'melee' for both melee and ranged attacks
    img: 'icons/svg/sword.svg', // Default icon
    system: {
      description: {
        value: strike.description || '',
      },
      actions: {
        value: actionInfo.value,
      },
      traits: {
        value: strike.traits || [],
      },
      bonus: {
        value: strike.attackBonus || 0,
      },
      damageRolls: Object.keys(damageRolls).length > 0 ? damageRolls : undefined,
      weaponType: {
        value: strike.name.toLowerCase().includes('ranged') ? 'ranged' : 'melee',
      },
    },
  };
}

/**
 * Convert a PF2e Feature to a Foundry Item
 * Features are special abilities (actions, passive abilities, etc.)
 */
export function featureToItem(feature: PF2eFeature): PF2eItem {
  const actionInfo = convertActionCost(feature.actionCost);

  return {
    name: feature.name,
    type: 'action', // PF2e system uses 'action' for abilities
    img: 'icons/svg/upgrade.svg', // Default icon
    system: {
      description: {
        value: feature.description || '',
      },
      actions: {
        value: actionInfo.value,
      },
      actionType: {
        value: actionInfo.type,
      },
      traits: {
        value: feature.traits || [],
      },
    },
  };
}

/**
 * Convert all strikes and features to Foundry Items
 */
export function convertPF2eItems(strikes: PF2eStrike[], features: PF2eFeature[]): PF2eItem[] {
  const items: PF2eItem[] = [];

  // Convert strikes
  for (const strike of strikes) {
    items.push(strikeToItem(strike));
  }

  // Convert features
  for (const feature of features) {
    items.push(featureToItem(feature));
  }

  return items;
}
