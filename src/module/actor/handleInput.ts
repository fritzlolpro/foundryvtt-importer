import { textToActor } from './parsers';
import { textToPF2eActor } from './parsers/pf2eIndex';
import { actorToFifth, spellsToSpellSlots } from './convert';
import { actorToPF2e } from './convertPF2e';
import { UserData } from '../importForm';
import { FifthItem } from './templates/fifthedition';
import { itemToFifth, spellToFifth } from '../item/convert';

/**
 * Route for D&D 5e text import (existing functionality)
 */
async function txtRoute5e(stringData: string) {
  const actor = textToActor(stringData);
  const { items } = actor;
  const preparedItems = await Promise.all(
    items.map((item) => {
      return itemToFifth(item);
    }),
  );

  let reducedSpells: Array<FifthItem> = [];
  if (actor?.spells) {
    const addedSpells: Array<FifthItem | undefined> = await Promise.all(
      actor?.spells?.map((spell) => {
        return spellToFifth(spell);
      }),
    );

    reducedSpells = addedSpells.reduce((acc: FifthItem[], cur: FifthItem | undefined) => {
      if (cur) {
        acc.push(cur);
      }
      return acc;
    }, []);

    preparedItems.push(...reducedSpells);
  }

  const spellSlots = spellsToSpellSlots(actor.spells, reducedSpells);

  const convertedActor = actorToFifth(actor);
  convertedActor.spells = spellSlots;

  // call spellSlots here
  const foundryActor = await Actor.create({
    name: actor.name,
    type: 'npc',
    system: convertedActor,
  });

  if (!foundryActor) return;

  await Promise.all(
    preparedItems.map(async (item: FifthItem) => {
      const foundryItem = new Item(item);
      await foundryActor.createEmbeddedDocuments('Item', [foundryItem.toObject()]);
    }),
  );
}

/**
 * Route for Pathfinder 2e text import (new functionality)
 */
async function txtRoutePF2e(stringData: string) {
  try {
    console.log('=== PF2e Import Debug Info ===');
    console.log('Input lines:');
    stringData.split('\n').forEach((line, i) => {
      console.log(`  Line ${i + 1}: "${line}"`);
    });
    
    const actor = textToPF2eActor(stringData);
    console.log('Parsed actor:', actor);
    
    const convertedActor = actorToPF2e(actor);
    console.log('Converted actor data:', convertedActor);

    // Create the actor in Foundry
    const foundryActor = await Actor.create({
      name: actor.name,
      type: 'npc',
      system: convertedActor,
    });

    if (!foundryActor) {
      console.error('Failed to create Foundry actor');
      ui.notifications?.error('Failed to create actor in Foundry');
      return;
    }
    
    console.log('Successfully created PF2e actor:', foundryActor.name);
    ui.notifications?.info(`Successfully imported PF2e creature: ${foundryActor.name}`);

    // TODO: Add item support for PF2e when needed
    // Currently focused on basic stat block parsing
  } catch (error) {
    console.error('=== PF2e Import Error ===');
    console.error('Error details:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      ui.notifications?.error(`PF2e Import Error: ${error.message}`);
    } else {
      ui.notifications?.error('PF2e Import Error: Unknown error occurred');
    }
    throw error;
  }
}

/**
 * Main route handler - detects game system and routes appropriately
 */
async function txtRoute(stringData: string) {
  const gameSystem = (game as Game)?.system?.id;

  if (gameSystem === 'pf2e') {
    console.log('Processing as Pathfinder 2e actor');
    await txtRoutePF2e(stringData);
  } else {
    // Default to D&D 5e for backward compatibility
    console.log('Processing as D&D 5e actor');
    await txtRoute5e(stringData);
  }
}

export async function processActorInput({ jsonfile, clipboardInput }: UserData) {
  if (clipboardInput) {
    console.log(`Clipboard input: ${clipboardInput}`);
    txtRoute(clipboardInput);
    return;
  }
  const response = await fetch(jsonfile);
  if (!response.ok) {
    console.log(`Error reading ${jsonfile}`);
    return;
  }
  const data = await response.text();
  console.log(`Data: ${data}`);

  const ext = jsonfile.split('.').pop();
  switch (ext) {
    default:
      console.log(`Unknown file type ${ext}`);
  }
}
