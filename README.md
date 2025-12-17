# Foundry VTT Content Parser

[![Checks](https://github.com/EthanJWright/foundryvtt-importer/workflows/Checks/badge.svg)](https://github.com/EthanJWright/foundryvtt-importer/actions)
![Latest Release Download Count](https://img.shields.io/github/downloads/EthanJWright/foundryvtt-importer/latest/module.zip)
[![Github All Releases](https://img.shields.io/github/downloads/EthanJWright/foundryvtt-importer/total.svg)]()

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/U6U877XT1)

Create foundry elements from external sources.

## Usage

1. Press import button in tab you are trying to import
2. Copy text of entry you are trying to import
3. Paste in the clipboard text area
4. Press okay
5. Tweak and use imported data

## Demos

*Import a monster from a PDF*
(using Zathura as my PDF reader)

![Actor Importing from PDF](https://media0.giphy.com/media/0RYtEwdcfiB6zQURlK/giphy.gif?cid=790b7611c1b01d4886800fd3d18d238cb08b6d0b63bf3159&rid=giphy.gif&ct=g)

*Import a table from reddit.com/r/BehindTheTables*

![Table Importing from Reddit](https://media4.giphy.com/media/qeiKk0SSvOPngZpca0/giphy.gif?cid=790b761108da49b64336e28d589d0dd28259b61333b5f74e&rid=giphy.gif&ct=g)

*Import an item from a PDF*

![Item Importing from PDF](https://media3.giphy.com/media/geoyoPvqw6hSn3CJgQ/giphy.gif?cid=790b76113d7feb89632e00f526f0c16b20f63f8127036c60&rid=giphy.gif&ct=g)

*Import Journal Entries*

![Import Journal Entries](https://media3.giphy.com/media/s1eayXpAxvewapb55H/giphy.gif?cid=790b76118c77469b29e65fb1182ad4ccf7cf480e949caa1b&rid=giphy.gif&ct=g)

## Support

Currently supports **D&D 5e** and **Pathfinder 2e** game systems. The module automatically detects which system you're using and applies the appropriate parser.

### Supported Systems

- **D&D 5e**: Full support for actors, items, spells, tables, and journals
- **Pathfinder 2e**: Actor/creature stat block parsing with automatic system detection

## Key Features

### Tables

Import tables from external sources, creating quick collections.

Import tables from:

- Create many tables all nested in a folder from [Reddit](https://www.reddit.com/r/BehindTheTables)
- Copy and paste data to be parsed (reddit, entries per line, csv, json, etc.)
- Import text files (new lines are table entries)
- Import CSV files (first column treated as roll hits)
- Import from JSON (a few different structures to suite needs, easy to generate from scripts)
- Generate NPCs with ChatGPT and import them into foundry!

Reddit.

---

### Actors

Import actors from text based monster/creature blocks. Copy text from a PDF or other source and paste into the clipboard utility. The module will automatically detect your game system and parse accordingly.

#### D&D 5e Actor Import

**Note: D&D 5e actor import documentation has been moved to [README_DND5E.md](README_DND5E.md) as it has not been tested after recent changes.**

#### Pathfinder 2e Actor Import

- Parse PF2e creature stat blocks from PDFs (e.g., Archives of Nethys format)
- Automatically extracts:
  - Creature level, size, and traits
  - Perception with special senses
  - Languages
  - Ability modifiers (Str, Dex, Con, Int, Wis, Cha)
  - Saves (Fort, Ref, Will) with proficiency levels
  - Skills with modifiers
  - AC, HP, speeds (walk, fly, burrow, etc.)
  - Immunities, resistances, and weaknesses
- Works with creatures of any level (-1 to 25+)

**System Detection**: The module automatically detects whether you're using D&D 5e or Pathfinder 2e based on `game.system.id` and uses the appropriate parser.

### Items (5e only)

**Note: D&D 5e item import documentation has been moved to [README_DND5E.md](README_DND5E.md) as it has not been tested after recent changes.**

### Journals

Copy and paste text from anywhere, toggle if you want this to convert to one or
multiple journal entries.

Paste HTML to get formatted journals, each h1 tag is treated as a new page.

I'm playing around with using [Open AI](https://github.com/EthanJWright/ai_format) to parse PDFs (that I convert to text with pdftotext) into HTML.

or

Import journals from a structured JSON created by some other tool, such as my [PDF Parse](https://github.com/EthanJWright/pdfparse)
tool which attempts to process modules that may be found in DMs guild.

## Have an issue?

Open an issue [here](https://github.com/EthanJWright/foundryvtt-importer/issues) and follow the template.

Sample data that I have for testing parsers is limited. If you have
sample data that is not working, please open an issue and I can add it
to my tests and update the parsers.

## Tables

Tables can be imported from a JSON file with a simple structure, a txt file, or
through a CSV file. Each method is documented below.

### Reddit

The table tool comes with a text box where you can copy/paste tables from the
[Behind the Tables subreddit.](https://www.reddit.com/r/BehindTheTables)

A single table can be created:

```txt
d10 This place is (or was) a...

    A stronghold.

    A temple.

    A tomb.

    A prison.

    A mine.

    A lair.

    A palace.

    A storage vault.

    A sewer.

    A maze.
```

Or multiple tables can be part of a collection, which will be placed in a
folder:

```txt
Random Dungeons

d10 This place is (or was) a...

    A stronghold.

    A temple.

    A tomb.

    A prison.

    A mine.

    A lair.

    A palace.

    A storage vault.

    A sewer.

    A maze.

d12 ...built by...

    An ancient dwarvish clan.

    An ancient elf prince.

    A powerful wizard.

    A dark sorceress.

    A foreign empire.

    An ambitious queen of old.

    Prosperous merchants.

    A powerful noble family.

    Religious zealots.

    An ancient race of giants.

    A tyrannical king of old.

    No one; it's a natural cave.

d12 ...and located...

    Beneath a cold mountain.

    Beneath a fiery mountain.

    Near a well-traveled mountain pass.

    Deep within a forest.

    Deep within a desert.

    Beside the sea.

    On an island.

    Beneath a bustling city.

    Beneath the ruin of an ancient city.

    Beneath a well-known castle or monastery.

    Beneath a the ruin of an old castle or monastery.

    In a place reachable only by magic.

d12 The place is currently occupied by...

    A dangerous outlaw.

    An elemental lord.

    A vampire.

    A lich.

    A demon.

    A devil.

    An orc warlord.

    A hobgoblin commander.

    An aberrant presence.

    A witch.

    A giant.

    A dragon.
```

### JSON

A structure similar to Foundry's interface for tables is valid:

```json
{
  "name": "Goods",
  "formula": "1d12",
  "results": [
    { "range": [1, 4], "text": "Backpacks or sacks" },
    { "range": [5, 6], "text": "Baskets" },
    { "range": [7, 8], "text": "Bricks" },
    { "range": [9, 10], "text": "Books" },
    { "range": [11, 12], "text": "Cloth" }
  ]
}
```

Or a simpler structure can be passed and the formula and ranges will be
automatically calculated and evenly distributed:

```json
{
  "name": "Goods",
  "results": ["Backpacks or sacks", "Baskets", "Bricks", "Books", "Cloth"]
}
```

### Text Files

A .txt file can be used to create a rollable table, the importer will just
treat each new line as an item in the table. The filename will be used as the
table name.

goods.txt :

```txt
Backpacks or sacks
Baskets
Bricks
Books
Cloth
```

### CSVs

A .csv can be used for a rollable table. as commas are quite common in text
that will appear in rollable tables, the pipe is used as the delimiter instead
(|) The file name will be used for the table name.

goods.csv

```csv
01-04|Backpacks or sacks
05-06|Baskets
07-08|Bricks
09-10|Books
11-12|Cloth
```

## Actors (5e and Pathfinder 2e only)

Actors can be created by copying the text of a mosnter block into the clipboard
tool.

The tool is designed to handle several standard formats of monster blocks, and
attempts to resolve as many elements as possible into Foundry Actor items.

### Pathfinder 2e

```txt
CROCODILE CREATURE 2
N LARGE ANIMAL
Perception +7; low-light vision
Skills Athletics +8, Stealth +7 (+11 in water)
Str +4, Dex +1, Con +3, Int -5, Wis +1, Cha –4
Deep Breath The crocodile can hold its breath for about 2 hours.
AC 18; Fort +9, Ref +7, Will +5
HP 30
Speed 25 feet, swim 25 feet
Melee [one-action] jaws +10, Damage 1d10+4 piercing plus Grab
Melee [one-action] tail +10 (agile), Damage 1d6+4 bludgeoning
Aquatic Ambush [one-action] When hiding in water, the crocodile can move up to 35 feet, traveling on water and land, then make a jaws Strike against a creature that is unaware of it. The crocodile gains a +2 circumstance bonus to the attack roll.
Camouflage [one-action] The crocodile can change its color to match its surroundings. It can use this action to Hide up to a creature that doesn’t see it and doesn’t know where it is and make a Strike against that creature. The creature is flat-footed against the attack.
Death Roll [one-action] (attack) The crocodile tucks its legs and rolls rapidly, twisting its victim. It makes a jaws Strike with a +2 circumstance bonus to the attack roll against a creature it has grabbed. If it hits, it also knocks the creature prone. If it fails, it releases the creature.
Grab [one-action] After succeeding at a jaws Strike, the crocodile can use this action to automatically give the target the grabbed condition until the end of the crocodile’s next turn.
```



## Journals

### Using your clipboard

You can create very quick journal entries by pasting journal data. If you
select 'Should become multiple journal entries' the module will make best
effort guesses at where the data should be logically split, and create a folder
of unique journal entries.

### Using JSON

Journal entries can be created through a tree like JSON structure as seen
below.

```json
[
  {
    "value": "Chapter 1",
    "tag": "h2",
    "notes": [
      {
        "value": "Treasure: 200 gp",
        "tag": "p"
      },
      {
        "value": "Description: A caravan of goblins descends on the party.",
        "tag": "p"
      }
    ],
    "children": [
      {
        "value": "NPCs",
        "tag": "h3",
        "notes": [
          {
            "value": "Grib the Goblin : friendly, short, willing to bargin.",
            "tag": "p"
          },
          {
            "value": "Chadwick: captured by goblins, wants to be rescued but will betray the adventurers",
            "tag": "p"
          }
        ]
      }
    ]
  }
]
```

The typescript interfaces for the JSON are as follows

```typescript
interface Note {
  value: string;
  tag: string;
}

interface JsonData {
  value: string;
  tag: string;
  notes: Array<Note>;
  children: Array<JsonData>;
  sortValue?: number;
}
```

### Sources for importing

The project [PDF Parse](https://github.com/EthanJWright/pdfparse) is an attempt
to scrub through PDFs and based on configured parameters output a JSON of the
format above. When combined this module should allow for PDFs to be read into
Foundry.

## Plans for future implementation

- Import journals from markdown directories (such as Obsidian)
- Actor importing is basic, want to add fine tuning for Items & add Spells
- Make settings more configurable (to hide unused elements)
- Make parsers more modular to allow for easy extensibility
- Support for adding items/weapons/armor etc. Including from CSV.
- Export to compendium. I can see people using this to import work from larger datasets and wanting to share or add them to modules.

## Contributing to the codebase

See [README_DEV.md](README_DEV.md) for development and contribution guidelines.
