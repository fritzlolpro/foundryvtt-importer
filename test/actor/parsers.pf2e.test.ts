import { textToPF2eActor } from '../../src/module/actor/parsers/pf2eIndex';
import { PHANTASMAL_MINION, GOBLIN_WARRIOR, ANCIENT_RED_DRAGON, CROCODILE } from './__fixtures__/pf2e/creatures';
import { SIMPLE_CREATURE } from './__fixtures__/pf2e/simpleCreature';
import { PRECIOUS_CAT } from './__fixtures__/pf2e/companion';
import { LOWERCASE_CREATURE, UPPERCASE_CREATURE, MIXED_CASE_CREATURE } from './__fixtures__/pf2e/caseInsensitive';

describe('PF2e Actor Parsers', () => {
  describe('Simple Creature (lowercase creature format)', () => {
    it('should parse name correctly', () => {
      const actor = textToPF2eActor(SIMPLE_CREATURE);
      expect(actor.name).toBe('Test simple'); // "creature 0" означает существо уровня 0
    });

    it('should parse level correctly', () => {
      const actor = textToPF2eActor(SIMPLE_CREATURE);
      expect(actor.level).toBe(0);
    });

    it('should parse size correctly from traits line', () => {
      const actor = textToPF2eActor(SIMPLE_CREATURE);
      expect(actor.size).toBe('Medium');
    });

    it('should parse perception correctly', () => {
      const actor = textToPF2eActor(SIMPLE_CREATURE);
      expect(actor.perception.value).toBe(9);
    });

    it('should parse abilities correctly', () => {
      const actor = textToPF2eActor(SIMPLE_CREATURE);
      expect(actor.abilities.str.mod).toBe(0);
      expect(actor.abilities.dex.mod).toBe(3);
      expect(actor.abilities.con.mod).toBe(2);
      expect(actor.abilities.int.mod).toBe(2);
      expect(actor.abilities.wis.mod).toBe(-1);
      expect(actor.abilities.cha.mod).toBe(2);
    });

    it('should parse saves correctly', () => {
      const actor = textToPF2eActor(SIMPLE_CREATURE);
      expect(actor.saves.fortitude.value).toBe(3);
      expect(actor.saves.reflex.value).toBe(9);
      expect(actor.saves.will.value).toBe(6);
    });

    it('should parse AC correctly', () => {
      const actor = textToPF2eActor(SIMPLE_CREATURE);
      expect(actor.ac.value).toBe(15);
    });

    it('should parse HP correctly', () => {
      const actor = textToPF2eActor(SIMPLE_CREATURE);
      expect(actor.health.value).toBe(15);
    });

    it('should parse speed correctly', () => {
      const actor = textToPF2eActor(SIMPLE_CREATURE);
      expect(actor.speeds.walk).toBe(5);
    });
  });

  describe('Phantasmal Minion', () => {
    it('should parse name correctly', () => {
      const actor = textToPF2eActor(PHANTASMAL_MINION);
      expect(actor.name).toBe('Phantasmal Minion');
    });

    it('should parse level correctly', () => {
      const actor = textToPF2eActor(PHANTASMAL_MINION);
      expect(actor.level).toBe(-1);
    });

    it('should parse size correctly', () => {
      const actor = textToPF2eActor(PHANTASMAL_MINION);
      expect(actor.size).toBe('Medium');
    });

    it('should parse traits correctly', () => {
      const actor = textToPF2eActor(PHANTASMAL_MINION);
      expect(actor.traits).toContain('Force');
      expect(actor.traits).toContain('Mindless');
    });

    it('should parse perception correctly', () => {
      const actor = textToPF2eActor(PHANTASMAL_MINION);
      expect(actor.perception.value).toBe(0);
      expect(actor.perception.special).toContain('darkvision');
    });

    it('should parse abilities correctly', () => {
      const actor = textToPF2eActor(PHANTASMAL_MINION);
      expect(actor.abilities.str.mod).toBe(-4);
      expect(actor.abilities.dex.mod).toBe(2);
      expect(actor.abilities.con.mod).toBe(0);
      expect(actor.abilities.int.mod).toBe(-5);
      expect(actor.abilities.wis.mod).toBe(0);
      expect(actor.abilities.cha.mod).toBe(0);
    });

    it('should parse saves correctly', () => {
      const actor = textToPF2eActor(PHANTASMAL_MINION);
      expect(actor.saves.fortitude.value).toBe(0);
      expect(actor.saves.reflex.value).toBe(4);
      expect(actor.saves.will.value).toBe(0);
    });

    it('should parse AC correctly', () => {
      const actor = textToPF2eActor(PHANTASMAL_MINION);
      expect(actor.ac.value).toBe(13);
    });

    it('should parse HP correctly', () => {
      const actor = textToPF2eActor(PHANTASMAL_MINION);
      expect(actor.health.value).toBe(4);
      expect(actor.health.max).toBe(4);
    });

    it('should parse immunities correctly', () => {
      const actor = textToPF2eActor(PHANTASMAL_MINION);
      expect(actor.immunities).toContain('disease');
      expect(actor.immunities).toContain('mental');
    });

    it('should parse speeds correctly', () => {
      const actor = textToPF2eActor(PHANTASMAL_MINION);
      expect(actor.speeds.fly).toBe(30);
    });
  });

  describe('Goblin Warrior', () => {
    it('should parse name correctly', () => {
      const actor = textToPF2eActor(GOBLIN_WARRIOR);
      expect(actor.name).toBe('Goblin Warrior');
    });

    it('should parse level correctly', () => {
      const actor = textToPF2eActor(GOBLIN_WARRIOR);
      expect(actor.level).toBe(-1);
    });

    it('should parse size correctly', () => {
      const actor = textToPF2eActor(GOBLIN_WARRIOR);
      expect(actor.size).toBe('Small');
    });

    it('should parse traits correctly', () => {
      const actor = textToPF2eActor(GOBLIN_WARRIOR);
      expect(actor.traits).toContain('Goblin');
      expect(actor.traits).toContain('Humanoid');
    });

    it('should parse languages correctly', () => {
      const actor = textToPF2eActor(GOBLIN_WARRIOR);
      expect(actor.languages).toContain('Common');
      expect(actor.languages).toContain('Goblin');
    });

    it('should parse skills correctly', () => {
      const actor = textToPF2eActor(GOBLIN_WARRIOR);
      expect(actor.skills.length).toBeGreaterThan(0);
      const acrobatics = actor.skills.find((s) => s.name === 'Acrobatics');
      expect(acrobatics).toBeDefined();
      expect(acrobatics?.bonus).toBe(5);
    });

    it('should parse speeds correctly', () => {
      const actor = textToPF2eActor(GOBLIN_WARRIOR);
      expect(actor.speeds.walk).toBe(25);
    });
  });

  describe('Ancient Red Dragon', () => {
    it('should parse name correctly', () => {
      const actor = textToPF2eActor(ANCIENT_RED_DRAGON);
      expect(actor.name).toBe('Ancient Red Dragon');
    });

    it('should parse level correctly', () => {
      const actor = textToPF2eActor(ANCIENT_RED_DRAGON);
      expect(actor.level).toBe(19);
    });

    it('should parse size correctly', () => {
      const actor = textToPF2eActor(ANCIENT_RED_DRAGON);
      expect(actor.size).toBe('Huge');
    });

    it('should parse high level AC correctly', () => {
      const actor = textToPF2eActor(ANCIENT_RED_DRAGON);
      expect(actor.ac.value).toBe(45);
    });

    it('should parse high HP correctly', () => {
      const actor = textToPF2eActor(ANCIENT_RED_DRAGON);
      expect(actor.health.value).toBe(425);
    });

    it('should parse high saves correctly', () => {
      const actor = textToPF2eActor(ANCIENT_RED_DRAGON);
      expect(actor.saves.fortitude.value).toBe(35);
      expect(actor.saves.reflex.value).toBe(32);
      expect(actor.saves.will.value).toBe(33);
    });

    it('should parse high ability modifiers correctly', () => {
      const actor = textToPF2eActor(ANCIENT_RED_DRAGON);
      expect(actor.abilities.str.mod).toBe(9);
      expect(actor.abilities.dex.mod).toBe(5);
      expect(actor.abilities.con.mod).toBe(8);
    });

    it('should parse multiple speeds correctly', () => {
      const actor = textToPF2eActor(ANCIENT_RED_DRAGON);
      expect(actor.speeds.walk).toBe(60);
      expect(actor.speeds.fly).toBe(180);
    });

    it('should parse weaknesses correctly', () => {
      const actor = textToPF2eActor(ANCIENT_RED_DRAGON);
      expect(actor.weaknesses.length).toBeGreaterThan(0);
      const coldWeakness = actor.weaknesses.find((w) => w.type.includes('cold'));
      expect(coldWeakness).toBeDefined();
      expect(coldWeakness?.value).toBe(20);
    });
  });

  describe('Crocodile', () => {
    it('should parse crocodile name', () => {
      const actor = textToPF2eActor(CROCODILE);
      expect(actor.name).toBe('CROCODILE');
    });

    it('should parse crocodile level (default 2)', () => {
      const actor = textToPF2eActor(CROCODILE);
      expect(actor.level).toBe(2);
    });

    it('should parse Crocodile size from alignment line', () => {
      const actor = textToPF2eActor(CROCODILE);
      expect(actor.size).toBe('Large');
    });

    it('should parse Crocodile traits from alignment line', () => {
      const actor = textToPF2eActor(CROCODILE);
      expect(actor.traits).toContain('Animal');
    });

    it('should parse Crocodile perception', () => {
      const actor = textToPF2eActor(CROCODILE);
      expect(actor.perception.value).toBe(7);
    });

    it('should parse Crocodile abilities', () => {
      const actor = textToPF2eActor(CROCODILE);
      expect(actor.abilities.str.mod).toBe(4);
      expect(actor.abilities.dex.mod).toBe(1);
      expect(actor.abilities.con.mod).toBe(3);
      expect(actor.abilities.int.mod).toBe(-5);
      expect(actor.abilities.wis.mod).toBe(1);
      expect(actor.abilities.cha.mod).toBe(-4);
    });

    it('should parse Crocodile AC', () => {
      const actor = textToPF2eActor(CROCODILE);
      expect(actor.ac.value).toBe(18);
    });

    it('should parse Crocodile saves', () => {
      const actor = textToPF2eActor(CROCODILE);
      expect(actor.saves.fortitude.value).toBe(9);
      expect(actor.saves.reflex.value).toBe(7);
      expect(actor.saves.will.value).toBe(5);
    });

    it('should parse Crocodile HP', () => {
      const actor = textToPF2eActor(CROCODILE);
      expect(actor.health.max).toBe(30);
    });

    it('should parse Crocodile speed', () => {
      const actor = textToPF2eActor(CROCODILE);
      expect(actor.speeds.walk).toBe(25);
      expect(actor.speeds.swim).toBe(25);
    });

    it('should parse Crocodile skills (singular Skill)', () => {
      const actor = textToPF2eActor(CROCODILE);
      expect(actor.skills.length).toBeGreaterThan(0);
      const acrobatics = actor.skills.find((s) => s.name === 'Athletics');
      expect(acrobatics).toBeDefined();
      expect(acrobatics?.bonus).toBe(8);
    });
  });

  describe('Companion (Precious Cat)', () => {
    it('should parse companion name', () => {
      const actor = textToPF2eActor(PRECIOUS_CAT);
      expect(actor.name).toBe('PRECIOUS');
    });

    it('should parse companion level (default 0)', () => {
      const actor = textToPF2eActor(PRECIOUS_CAT);
      expect(actor.level).toBe(0);
    });

    it('should parse companion size from alignment line', () => {
      const actor = textToPF2eActor(PRECIOUS_CAT);
      expect(actor.size).toBe('Small');
    });

    it('should parse companion traits from alignment line', () => {
      const actor = textToPF2eActor(PRECIOUS_CAT);
      expect(actor.traits).toContain('Cat');
    });

    it('should parse companion perception', () => {
      const actor = textToPF2eActor(PRECIOUS_CAT);
      expect(actor.perception.value).toBe(5);
    });

    it('should parse companion abilities', () => {
      const actor = textToPF2eActor(PRECIOUS_CAT);
      expect(actor.abilities.str.mod).toBe(2);
      expect(actor.abilities.dex.mod).toBe(3);
      expect(actor.abilities.con.mod).toBe(1);
      expect(actor.abilities.int.mod).toBe(-4);
      expect(actor.abilities.wis.mod).toBe(2);
      expect(actor.abilities.cha.mod).toBe(0);
    });

    it('should parse companion AC', () => {
      const actor = textToPF2eActor(PRECIOUS_CAT);
      expect(actor.ac.value).toBe(16);
    });

    it('should parse companion saves', () => {
      const actor = textToPF2eActor(PRECIOUS_CAT);
      expect(actor.saves.fortitude.value).toBe(4);
      expect(actor.saves.reflex.value).toBe(6);
      expect(actor.saves.will.value).toBe(5);
    });

    it('should parse companion HP', () => {
      const actor = textToPF2eActor(PRECIOUS_CAT);
      expect(actor.health.max).toBe(11);
    });

    it('should parse companion speed', () => {
      const actor = textToPF2eActor(PRECIOUS_CAT);
      expect(actor.speeds.walk).toBe(35);
    });

    it('should parse companion skills (singular Skill)', () => {
      const actor = textToPF2eActor(PRECIOUS_CAT);
      expect(actor.skills.length).toBeGreaterThan(0);
      const acrobatics = actor.skills.find((s) => s.name === 'Acrobatics');
      expect(acrobatics).toBeDefined();
      expect(acrobatics?.bonus).toBe(6);
    });
  });

  describe('Case Insensitive Parsing', () => {
    it('should parse lowercase stat block', () => {
      const actor = textToPF2eActor(LOWERCASE_CREATURE);
      expect(actor.name).toBe('goblin warrior');
      expect(actor.level).toBe(0);
      expect(actor.size).toBe('Small');
      expect(actor.perception.value).toBe(3);
      expect(actor.abilities.dex.mod).toBe(3);
      expect(actor.ac.value).toBe(16);
      expect(actor.health.max).toBe(6);
      expect(actor.speeds.walk).toBe(25);
    });

    it('should parse UPPERCASE stat block', () => {
      const actor = textToPF2eActor(UPPERCASE_CREATURE);
      expect(actor.name).toBe('GOBLIN SNIPER');
      expect(actor.level).toBe(1);
      expect(actor.size).toBe('Small');
      expect(actor.perception.value).toBe(5);
      expect(actor.abilities.dex.mod).toBe(4);
      expect(actor.ac.value).toBe(17);
      expect(actor.health.max).toBe(16);
      expect(actor.speeds.walk).toBe(25);
    });

    it('should parse MiXeD CaSe stat block', () => {
      const actor = textToPF2eActor(MIXED_CASE_CREATURE);
      expect(actor.name).toBe('GoBLiN BoSs');
      expect(actor.level).toBe(1);
      expect(actor.size).toBe('Small');
      expect(actor.perception.value).toBe(6);
      expect(actor.abilities.str.mod).toBe(2);
      expect(actor.ac.value).toBe(17);
      expect(actor.health.max).toBe(16);
      expect(actor.speeds.walk).toBe(25);
    });

    it('should parse lowercase skills', () => {
      const actor = textToPF2eActor(LOWERCASE_CREATURE);
      const acrobatics = actor.skills.find((s) => s.name === 'acrobatics');
      expect(acrobatics).toBeDefined();
      expect(acrobatics?.bonus).toBe(5);
    });

    it('should parse UPPERCASE skills', () => {
      const actor = textToPF2eActor(UPPERCASE_CREATURE);
      const stealth = actor.skills.find((s) => s.name === 'STEALTH');
      expect(stealth).toBeDefined();
      expect(stealth?.bonus).toBe(7);
    });

    it('should parse lowercase languages', () => {
      const actor = textToPF2eActor(LOWERCASE_CREATURE);
      expect(actor.languages).toContain('goblin');
    });

    it('should parse UPPERCASE languages', () => {
      const actor = textToPF2eActor(UPPERCASE_CREATURE);
      expect(actor.languages).toContain('GOBLIN');
    });
  });

  describe('Crocodile (with strikes and features)', () => {
    it('should parse basic stats', () => {
      const actor = textToPF2eActor(CROCODILE);
      expect(actor.name).toBe('CROCODILE');
      expect(actor.level).toBe(2);
      expect(actor.size).toBe('Large');
      expect(actor.ac.value).toBe(18);
      expect(actor.health.max).toBe(30);
    });

    it('should parse abilities', () => {
      const actor = textToPF2eActor(CROCODILE);
      expect(actor.abilities.str.mod).toBe(4);
      expect(actor.abilities.dex.mod).toBe(1);
      expect(actor.abilities.con.mod).toBe(3);
    });

    it('should parse strikes (melee attacks)', () => {
      const actor = textToPF2eActor(CROCODILE);
      expect(actor.strikes.length).toBeGreaterThan(0);
      
      const jawsStrike = actor.strikes.find(s => s.name.includes('jaws'));
      expect(jawsStrike).toBeDefined();
      expect(jawsStrike?.attackBonus).toBe(10);
      expect(jawsStrike?.damage).toBe('1d10+4');
      expect(jawsStrike?.damageType).toBe('piercing');
    });

    it('should parse tail strike', () => {
      const actor = textToPF2eActor(CROCODILE);
      const tailStrike = actor.strikes.find(s => s.name.includes('tail'));
      expect(tailStrike).toBeDefined();
      expect(tailStrike?.attackBonus).toBe(10);
      expect(tailStrike?.traits).toContain('agile');
    });

    it('should parse features', () => {
      const actor = textToPF2eActor(CROCODILE);
      expect(actor.features.length).toBeGreaterThan(0);
    });

    it('should parse Deep Breath feature', () => {
      const actor = textToPF2eActor(CROCODILE);
      const deepBreath = actor.features.find(f => f.name === 'Deep Breath');
      expect(deepBreath).toBeDefined();
      expect(deepBreath?.description).toContain('hold its breath');
    });

    it('should parse Aquatic Ambush with action cost', () => {
      const actor = textToPF2eActor(CROCODILE);
      const ambush = actor.features.find(f => f.name === 'Aquatic Ambush');
      expect(ambush).toBeDefined();
      expect(ambush?.actionCost).toBe(1); // one-action
      expect(ambush?.description).toContain('hiding in water');
    });

    it('should parse Grab feature', () => {
      const actor = textToPF2eActor(CROCODILE);
      const grab = actor.features.find(f => f.name === 'Grab');
      expect(grab).toBeDefined();
      expect(grab?.actionCost).toBe(1);
      expect(grab?.description).toContain('grabbed condition');
    });

    it('should parse Death Roll with attack trait', () => {
      const actor = textToPF2eActor(CROCODILE);
      const deathRoll = actor.features.find(f => f.name === 'Death Roll');
      expect(deathRoll).toBeDefined();
      expect(deathRoll?.actionCost).toBe(1);
      expect(deathRoll?.traits).toContain('attack');
    });
  });
});
