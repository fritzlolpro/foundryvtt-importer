const CONSTANTS = Object.freeze({
    module: {
        name: 'foundryvtt-importer',
        title: 'Content Parser',
    },
});

class Config {
    constructor() {
        this.folderDepth = 3;
        this.journalImporter = true;
        this.tableImporter = true;
        this.actorImporter = true;
        this.itemImporter = true;
        this.pf2eActorImporter = true;
    }
    load(s) {
        this.folderDepth = this.getSetting(s, Config.keys.folderDepth);
        this.journalImporter = this.getSetting(s, Config.keys.journalImporter);
        this.tableImporter = this.getSetting(s, Config.keys.tableImporter);
        this.actorImporter = this.getSetting(s, Config.keys.actorImporter);
        this.itemImporter = this.getSetting(s, Config.keys.itemImporter);
        this.pf2eActorImporter = this.getSetting(s, Config.keys.pf2eActorImporter);
        return this;
    }
    /**
     * Helper method to quickly construct Settings from game.settings
     */
    static _load() {
        return new Config().load(game.settings);
    }
    getSetting(settings, key) {
        return settings.get(CONSTANTS.module.name, key);
    }
}
Config.keys = {
    folderDepth: 'folderDepth',
    journalImporter: 'journalImporter',
    tableImporter: 'tableImporter',
    actorImporter: 'actorImporter',
    itemImporter: 'itemImporter',
    pf2eActorImporter: 'pf2eActorImporter',
};
function registerSettings() {
    if (game === {})
        return;
    else {
        game?.settings?.register(CONSTANTS.module.name, 'folderDepth', {
            name: 'Folder Depth',
            hint: `Folders will only be created up to this depth. If this is set above ${CONST.FOLDER_MAX_DEPTH}, make sure you have a module like MoarFolders to increase the default depth.`,
            scope: 'world',
            config: true,
            type: Number,
            default: CONST.FOLDER_MAX_DEPTH,
        });
        game?.settings?.register(CONSTANTS.module.name, 'journalImporter', {
            name: 'Journal Importer',
            hint: 'Display the journal importer button. This imports JSON files and so it is less user friendly. (requires reload)',
            scope: 'world',
            config: true,
            type: Boolean,
            default: false,
        });
        game?.settings?.register(CONSTANTS.module.name, 'tableImporter', {
            name: 'Table Importer',
            hint: 'Display the table importer button. This imports tables pasted from reddit.com/r/BehindTheTables and other formats. (requires reload)',
            scope: 'world',
            config: true,
            type: Boolean,
            default: true,
        });
        game?.settings?.register(CONSTANTS.module.name, 'actorImporter', {
            name: 'Actor Importer (5E only)',
            hint: 'Display the actor importer button. This imports clipboard text formatted like a monster stat block (copied from a PDF) (requires reload)',
            scope: 'world',
            config: true,
            type: Boolean,
            default: true,
        });
        game?.settings?.register(CONSTANTS.module.name, 'itemImporter', {
            name: 'Item Importer (5E only)',
            hint: 'Display the item importer button. This imports clipboard text formatted like an Item or Spell (copied from a PDF) (requires reload)',
            scope: 'world',
            config: true,
            type: Boolean,
            default: true,
        });
        game?.settings?.register(CONSTANTS.module.name, 'pf2eActorImporter', {
            name: 'PF2e Actor Importer',
            hint: 'Enable Pathfinder 2e actor importing. Works alongside D&D 5e importer - system is auto-detected. (requires reload)',
            scope: 'world',
            config: true,
            type: Boolean,
            default: true,
        });
    }
}

async function preloadTemplates() {
    const templatePaths = [
        // Add paths to "modules/foundryvtt-importer/templates"
        `modules/${CONSTANTS.module.name}/templates/importTableForm.hbs`,
        `modules/${CONSTANTS.module.name}/templates/importActorForm.hbs`,
        `modules/${CONSTANTS.module.name}/templates/importItemForm.hbs`,
        `modules/${CONSTANTS.module.name}/templates/importJournalForm.hbs`,
    ];
    return loadTemplates(templatePaths);
}

function cleanName$1(name) {
    // replace all underscores with spaces
    // and capitalize the first letter of each word
    return name
        .replace(/_/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .replace(/%20/g, ' ')
        .trim();
}

const WEIGHT_RANGE_REGEX = /^[0-9]{1,3}-[0-9]{1,3}./;
const WEIGHT_REGEX = /^[0-9]{1,3}./;
function hasWeightsRange(item) {
    return WEIGHT_RANGE_REGEX.test(item.trim());
}
const breakLines = (data) => {
    const rawLines = data.split('\n');
    return rawLines.filter((line) => {
        return line !== '';
    });
};
const rangeStringMap = (current) => {
    let start, end;
    if (current.includes('-')) {
        [start, end] = current.split('-').map(Number);
    }
    else if (current.includes('–')) {
        [start, end] = current.split('–').map(Number);
    }
    else {
        start = Number(current);
        end = start;
    }
    if (end === 0) {
        end = 100;
    }
    if (start === 0) {
        start = 1;
    }
    return [start, end];
};
function addWeight(line) {
    let regex = WEIGHT_REGEX;
    if (hasWeightsRange(line)) {
        regex = WEIGHT_RANGE_REGEX;
    }
    const matches = line.trim().match(regex);
    if (!matches || matches.length > 1)
        throw new Error(`Invalid line: ${line} ${matches}`);
    return {
        text: line.replace(regex, '').trim(),
        range: rangeStringMap(matches[0]),
    };
}
function hasWeights(item) {
    return WEIGHT_REGEX.test(item.trim());
}

const DIE_REGEX = /d[0-9]{1,4}/;
function hasDieNumber(line) {
    // match d4, d6, d8, d10, d12, d20, d100
    return DIE_REGEX.test(line.trim());
}

function isFoundryTable(table) {
    return table.formula !== undefined;
}
const entryStringMap = (current, index) => {
    return {
        text: current,
        range: [index + 1, index + 1],
    };
};
function parseBasicJSON({ name, entries }) {
    const results = entries.map(entryStringMap);
    return {
        name: name,
        formula: formulaFromEntries(results),
        results,
    };
}
function parseFoundryJSON({ name, formula, results }) {
    return {
        name: name,
        formula,
        results: [...results],
    };
}
function formulaFromEntries(entries) {
    return `1d${entries[entries.length - 1].range[1]}`;
}
function nameFromFile(file) {
    // get the filename without the extension
    const withPath = file.split('.')[0];
    // remove the file path
    const name = withPath.split('/').pop() || withPath;
    // replace all underscores with spaces
    // and capitalize the first letter of each word
    return cleanName$1(name);
}
function isCSVTable(data) {
    const delims = ['|', ','];
    const check = data.split('\n')[0];
    return delims.reduce((acc, cur) => check.includes(cur) || acc, false);
}
function isJSONTable(data) {
    try {
        JSON.parse(data);
    }
    catch (e) {
        return false;
    }
    return true;
}
function numWithWeights(entries) {
    return entries.reduce((numWeights, cur) => {
        if (hasWeights(cur)) {
            numWeights += 1;
        }
        return numWeights;
    }, 0);
}
const trimDieLine = (line) => {
    return `1d${line.trim().split(' ')[0].replace('1d', '').replace('d', '')}`;
};
const parseFromTxt = (input) => {
    const table = input.replace('/t', '\n');
    const lines = breakLines(table);
    let name = lines.shift() || 'Parsed Table';
    const numWeighted = numWithWeights(lines);
    let formula;
    if (hasDieNumber(name)) {
        const split = name.split(/(d[0-9]{1,4})/);
        const dieLine = split[1];
        name = split[0];
        formula = trimDieLine(dieLine);
    }
    else if (hasDieNumber(lines[0])) {
        const dieLine = lines.shift();
        if (!dieLine) {
            throw new Error('No die line found');
        }
        formula = trimDieLine(dieLine);
    }
    let results;
    if (numWeighted > 0) {
        // remove any lines until we find the first line with weights
        let firstWeightIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            if (hasWeights(lines[i])) {
                firstWeightIndex = i;
                break;
            }
        }
        results = lines.slice(firstWeightIndex).reduce(entryTxtReduce, []);
    }
    else {
        results = lines.map(entryStringMap);
    }
    results = results.map((entry) => {
        entry.text = entry.text.trim();
        return entry;
    });
    return {
        name: nameFromFile(name),
        formula: formula ?? formulaFromEntries(results),
        results,
    };
};
const entryTxtReduce = (acc, curr) => {
    if (hasWeights(curr)) {
        const [stringRange, ...text] = curr.split(' ');
        const [start, end] = rangeStringMap(stringRange);
        acc.push({
            text: text.join(' '),
            range: [start, end],
        });
    }
    else {
        acc[acc.length - 1].text += ` ${curr}`;
    }
    return acc;
};
const entryCSVMap = (current) => {
    const [stringRange, text] = current.split('|');
    const [start, end] = rangeStringMap(stringRange);
    return {
        text,
        range: [start, end],
    };
};
function parseFromCSV(table) {
    const { name, entries } = table;
    const results = entries.map(entryCSVMap);
    return {
        name: nameFromFile(name),
        formula: formulaFromEntries(results),
        results,
    };
}
function parseMultiLineWeighted(inputTable) {
    const lines = breakLines(inputTable);
    let name = 'Parsed Table';
    if (!hasWeights(lines[0])) {
        name = lines.shift() || 'Parsed Table';
    }
    const withWeights = numWithWeights(lines);
    if (withWeights !== lines.length / 2) {
        throw new Error('Not a multi line weighted table');
    }
    const entries = lines.reduce((acc, curr) => {
        if (hasWeights(curr)) {
            acc.push(addWeight(curr));
        }
        else {
            acc[acc.length - 1].text = curr;
        }
        return acc;
    }, []);
    const formula = formulaFromEntries(entries);
    return {
        name,
        formula,
        results: entries,
    };
}

function cleanName(name) {
    return name
        .replace(/d[0-9]{1,3}/, '')
        .replace(/[0-9]{1,3}/, '')
        .trim();
}
function parseWeightedTable(userInput) {
    const raw = breakLines(userInput);
    const lines = raw.filter((line) => line !== '');
    let rawName = 'Parsed Table';
    if (!hasWeights(lines[0]) || hasDieNumber(lines[0])) {
        rawName = lines.shift() || 'No Name';
    }
    const name = cleanName(rawName);
    return applyWeights(name, lines);
}
function isRedditTable(userInput) {
    const parsed = parseWeightedTable(userInput);
    parsed.results.forEach((entry) => {
        if (entry.range[0] === NaN || entry.range[1] === NaN) {
            return false;
        }
    });
    return parsed.results.length > 0 && /^d[0-9]{1,3}/.test(userInput.trim());
}
function isRedditCollection(userInput) {
    const parsed = parseRedditCollection(userInput);
    parsed.collection.forEach((table) => {
        table.results.forEach((entry) => {
            if (entry.range[0] === NaN || entry.range[1] === NaN) {
                return false;
            }
        });
    });
    return parsed.collection.length > 1 && userInput.split(/\nd[0-9]{1,2}/).length > 1;
}
function applyWeights(name, lines) {
    let results = undefined;
    let formula = `1d${lines.length}`;
    if (hasWeights(lines[0])) {
        results = lines.map(addWeight);
        formula = formulaFromEntries(results);
    }
    else {
        results = lines.map((line, index) => {
            return {
                range: [index + 1, index + 1],
                text: line.trim(),
            };
        });
    }
    return {
        name,
        formula,
        results,
    };
}
function parseRedditTable(userInput) {
    const raw = userInput.split('\n');
    const lines = raw.filter((line) => line !== '');
    const rawName = lines.shift() || 'No Name';
    const replacedName = rawName.replace(/d[0-9]{1,3}/, '').replace(/[0-9]{1,3}/, '');
    const name = replacedName.trim();
    return applyWeights(name, lines);
}
function parseRedditCollection(userInput) {
    const tables = userInput.split(/\nd[0-9]{1,2}/);
    return {
        name: (tables.shift() || 'No Name').trim(),
        collection: tables.map((table) => parseRedditTable(table)),
    };
}

async function createTableFromJSON(tableJSON) {
    let parsed;
    if (isFoundryTable(tableJSON)) {
        parsed = parseFoundryJSON(tableJSON);
    }
    else {
        parsed = parseBasicJSON(tableJSON);
    }
    await RollTable.create(parsed);
}
async function jsonRoute(stringData) {
    const json = JSON.parse(stringData);
    createTableFromJSON(json);
}
function tryParseTables(parsers, inputTable) {
    for (const parser of parsers) {
        try {
            const table = parser(inputTable);
            if (table) {
                return table;
            }
        }
        catch (e) {
            // trying other parsers
        }
    }
    throw new Error(`Unable to parse table`);
}
function txtToFoundry(stringData) {
    return tryParseTables([parseFromTxt, parseWeightedTable, parseMultiLineWeighted], stringData);
}
async function txtRoute$1(stringData) {
    console.log(`Data: ${stringData}`);
    await RollTable.create(txtToFoundry(stringData));
}
async function csvRoute(fullFileName, data) {
    console.log(`CSV Data: ${data}`);
    const lines = breakLines(data);
    const parse = parseFromCSV({ name: fullFileName, entries: lines });
    await RollTable.create(parse);
}
async function handleRedditCollection(input) {
    const parsed = parseRedditCollection(input);
    const folder = await Folder.create({ name: parsed.name, type: 'RollTable', sorting: 'm' });
    const promises = parsed.collection.map(async (table, index) => {
        return RollTable.create({ ...table, folder: folder?.data?._id, sort: index });
    });
    await Promise.all(promises);
}
async function redditTableRoute(input) {
    if (isRedditCollection(input)) {
        return handleRedditCollection(input);
    }
    else {
        const parsed = parseWeightedTable(input);
        await RollTable.create(parsed);
    }
}
async function processTableJSON({ jsonfile, clipboardInput }) {
    if (clipboardInput) {
        try {
            if (isJSONTable(clipboardInput)) {
                console.log(`Parsing as JSON`);
                await jsonRoute(clipboardInput);
            }
            else if (isCSVTable(clipboardInput)) {
                console.log(`Parsing as CSV`);
                await csvRoute('CSV Imported Table', clipboardInput);
            }
            else if (isRedditCollection(clipboardInput)) {
                console.log(`Parsing as Reddit Collection`);
                await redditTableRoute(clipboardInput);
            }
            else if (isRedditTable(clipboardInput)) {
                console.log(`Parsing as Reddit Table`);
                await redditTableRoute(clipboardInput);
            }
            else {
                console.log(`Parsing as TXT`);
                await txtRoute$1(clipboardInput);
            }
        }
        catch (e) {
            console.log(`Error while processing table: ${e} | attempting base text route parsing.`);
            await txtRoute$1(clipboardInput);
        }
        return;
    }
    const response = await fetch(jsonfile);
    if (!response.ok) {
        console.log(`Error reading ${jsonfile}`);
        return;
    }
    const data = await response.text();
    const ext = jsonfile.split('.').pop();
    switch (ext) {
        case 'json':
            jsonRoute(data);
            break;
        case 'txt':
            txtRoute$1(`${jsonfile}\n${data}`);
            break;
        case 'csv':
            csvRoute(jsonfile, data);
            break;
        default:
            console.log(`Unknown file type ${ext}`);
    }
}

class ImportGenericForm extends FormApplication {
    constructor({ handler, tab }) {
        super({});
        this._handler = handler;
        this.tab = tab;
    }
    get handler() {
        return this._handler;
    }
    set handler(handler) {
        this._handler = handler;
    }
    async _updateObject(_, formData) {
        if (!formData || formData === {})
            return;
        const data = formData;
        console.log(`data: ${JSON.stringify(data, null, 2)}`);
        this.handler(data);
        return;
    }
}

class importActorForm extends ImportGenericForm {
    constructor({ handler, tab }) {
        super({ handler, tab });
    }
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            jQuery: false,
            width: 400,
            top: window.innerHeight - window.innerHeight + 20,
            left: window.innerWidth - 710,
            template: `modules/${CONSTANTS.module.name}/templates/importActorForm.hbs`,
        });
    }
}

class importTableForm extends FormApplication {
    constructor(handler, tab) {
        super({});
        this._handler = handler;
        this.tab = tab;
    }
    get handler() {
        return this._handler;
    }
    set handler(handler) {
        this._handler = handler;
    }
    async _updateObject(_, formData) {
        if (!formData || formData === {})
            return;
        const data = formData;
        console.log(`data: ${JSON.stringify(data, null, 2)}`);
        this.handler(data);
        return;
    }
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            jQuery: false,
            width: 400,
            top: window.innerHeight - window.innerHeight + 20,
            left: window.innerWidth - 710,
            template: `modules/${CONSTANTS.module.name}/templates/importTableForm.hbs`,
        });
    }
}

class importItemForm extends ImportGenericForm {
    constructor({ handler, tab }) {
        super({ handler, tab });
    }
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            jQuery: false,
            width: 400,
            top: window.innerHeight - window.innerHeight + 20,
            left: window.innerWidth - 710,
            template: `modules/${CONSTANTS.module.name}/templates/importItemForm.hbs`,
        });
    }
}

class importJournalForm extends ImportGenericForm {
    constructor({ handler, tab }) {
        super({ handler, tab });
    }
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            jQuery: false,
            width: 400,
            top: window.innerHeight - window.innerHeight + 20,
            left: window.innerWidth - 710,
            template: `modules/${CONSTANTS.module.name}/templates/importJournalForm.hbs`,
        });
    }
}

function renderSidebarButtons(app, tab, handler) {
    const name = tab.charAt(0).toUpperCase() + tab.slice(1);
    const html = app.element;
    // Check if button already exists
    if (html.querySelector('#inputButton'))
        return;
    // Create button element
    const button = document.createElement('button');
    button.id = 'inputButton';
    button.style.flexBasis = 'auto';
    button.innerHTML = `<i class="fas fa-atlas"></i> Import ${name}`;
    // Find header-actions and append button
    const headerActions = html.querySelector('.header-actions');
    if (!headerActions)
        return;
    headerActions.appendChild(button);
    // Add click event listener
    button.addEventListener('click', async (e) => {
        e.preventDefault();
        switch (tab) {
            case 'journal': {
                const form = new importJournalForm({ handler, tab });
                form.render(true);
                break;
            }
            case 'tables': {
                const form = new importTableForm(handler, tab);
                form.render(true);
                break;
            }
            case 'actors': {
                const form = new importActorForm({ handler, tab });
                form.render(true);
                break;
            }
            case 'items': {
                const form = new importItemForm({ handler, tab });
                form.render(true);
                break;
            }
            default:
                throw new Error(`Unknown tab: ${tab}`);
        }
    });
}

function parseGenericFormula(line, regexStart) {
    // line: Hit Points 66 (12d8 + 12)
    // get string from between parentheses
    // match = (12d8 + 12),12d8 + 12
    const formulaArray = line.match(/\(([^)]+)\)/);
    const regexSplit = line.split(regexStart);
    const beforeRegex = regexSplit[0];
    const afterRegex = regexSplit[1];
    let dieFormula = '';
    let change = '';
    let formula = undefined;
    if (!formulaArray || formulaArray.length < 2) ;
    else {
        // pull formula from match
        formula = formulaArray[1];
        if (formula.includes('+')) {
            dieFormula = formula.split('+')[0];
            change = formula.split('+')[1];
        }
        else if (formula.includes('-')) {
            dieFormula = formula.split('-')[0];
            change = '-' + formula.split('-')[1];
        }
        else {
            dieFormula = formula;
            change = '0';
        }
    }
    const numOfDice = dieFormula.split('d')[0];
    const dieSize = dieFormula.split('d')[1];
    // get value after Hit Points string
    const hp = line.match(regexStart) || '10';
    let afterFormula;
    let beforeFormula;
    if (formula) {
        const formulaSplit = line.split(formula).map((item) => item.replace('(,', '').replace(')', ''));
        afterFormula = formulaSplit[1];
        beforeFormula = formulaSplit[0];
    }
    return {
        value: parseInt(hp[1]),
        min: Number(numOfDice) + Number(change),
        max: Number(numOfDice) * Number(dieSize) + Number(change),
        str: formula,
        afterRegex,
        beforeRegex,
        mod: Number(change),
        afterFormula,
        beforeFormula,
    };
}

function parseMeasurement(description, keyWord) {
    const unitText = description.split(keyWord)[0].trim();
    const lastItem = unitText.split(' ').pop() || '';
    return parseInt(lastItem.split('-')[0]);
}
function parseSpellCone(description) {
    // like 20-foot-radius sphere
    return parseMeasurement(description, 'cone');
}
function parseSpellSphere(description) {
    // like 20-foot-radius sphere
    return parseMeasurement(description, 'radius');
}
function parseRange(description) {
    if (/reach/i.test(description)) {
        const stringValue = description.split(/reach/)[1].trim().split(' ')[0];
        const value = parseInt(stringValue);
        if (!isNaN(value))
            return { value, units: 'ft' };
    }
    if (/range/i.test(description)) {
        const rangeStr = description.split(/range/i)[1].trim().split(' ')[0];
        const [value, long] = rangeStr.split('/').map((str) => parseInt(str));
        if (isNaN(value)) {
            const rangeRegex = /range (\d+) ft./;
            const rangeMatch = description.match(rangeRegex);
            if (rangeMatch) {
                const rangeValue = parseInt(rangeMatch[1]);
                if (!isNaN(rangeValue))
                    return { value: rangeValue, units: 'ft' };
            }
        }
        if (!isNaN(value))
            return { value, long, units: 'ft' };
    }
    if (/cone/i.test(description)) {
        const value = parseSpellCone(description);
        if (!isNaN(value))
            return { value, units: 'self' };
    }
    if (/within/i.test(description)) {
        const rangeStr = description
            .split(/within/i)[1]
            .trim()
            .split('ft')[0]
            .trim();
        const value = parseInt(rangeStr);
        if (!isNaN(value)) {
            return { value, units: 'ft' };
        }
    }
}
function parseDamageType(from) {
    if (from.includes('piercing'))
        return 'piercing';
    if (from.includes('slashing'))
        return 'slashing';
    if (from.includes('bludgeoning'))
        return 'bludgeoning';
    if (from.includes('fire'))
        return 'fire';
    if (from.includes('cold'))
        return 'cold';
    if (from.includes('lightning'))
        return 'lightning';
    if (from.includes('acid'))
        return 'acid';
    if (from.includes('poison'))
        return 'poison';
    if (from.includes('psychic'))
        return 'psychic';
    if (from.includes('radiant'))
        return 'radiant';
    if (from.includes('thunder'))
        return 'thunder';
    if (from.includes('force'))
        return 'force';
    if (from.includes('necrotic'))
        return 'necrotic';
    if (from.includes('psychic'))
        return 'psychic';
    throw new Error(`Unable to parse damage type from ${from}`);
}
function parseType(description) {
    // match if (1d8)
    if (isWeaponType(description))
        return 'weapon';
    if (/armor/i.test(description))
        return 'equipment';
    if (/unil the next dawn/i.test(description))
        return 'consumable';
    if (/beginning at/i.test(description))
        return 'feat';
    if (/starting at/i.test(description))
        return 'feat';
    return 'consumable';
}
function parseActivation(name, description, section) {
    // cost parsed from something like Wings of Syranita (Costs 2 Actions)
    const costString = name.match(/\(Costs (\d+) Actions\)/);
    const cost = costString ? parseInt(costString[1]) : 1;
    if (section) {
        switch (section) {
            case 'action': {
                return {
                    type: 'action',
                    cost,
                };
            }
            case 'bonus': {
                return {
                    type: 'bonus',
                    cost,
                };
            }
            case 'reaction': {
                return {
                    type: 'reaction',
                    cost,
                };
            }
            case 'legendary': {
                return {
                    type: 'legendary',
                    cost,
                };
            }
        }
    }
    if (/attack/i.test(description))
        return {
            type: 'action',
            cost,
        };
    if (description.includes('action'))
        return {
            type: 'action',
            cost,
        };
    if (description.includes('bonus action'))
        return {
            type: 'bonus',
            cost,
        };
    if (description.includes('spell save'))
        return {
            type: 'action',
            cost,
        };
    if (description.includes('saving throw'))
        return {
            type: 'action',
            cost,
        };
}
function buildDamageParts(description) {
    // description = 'Melee Weapon Attack: +6 to hit, reach 5 ft., one target.Hit: 8 (1d8 + 4) piercing damage.'
    const uncleanParts = description.split('plus');
    if (!uncleanParts)
        throw new Error(`Unable to parse damage parts from ${description}`);
    const parts = uncleanParts.map((part) => {
        const parsed = parseGenericFormula(part, /Melee Weapon Attack: +/);
        if (!parsed || !parsed?.str)
            throw new Error(`Unable to parse damage parts from ${description}`);
        const fromString = parsed.afterFormula ? parsed.afterFormula : part;
        return [parsed.str, parseDamageType(fromString)];
    });
    return parts;
}
// regex to match a die formula
function isWeaponType(input) {
    const dieRegex = /(\d+d\d+)/;
    return dieRegex.test(input) && /weapon/i.test(input);
}
// the logic for parsing type is different if it is sourced from a monster
function parseTypeFromActorFeature(input) {
    if (isWeaponType(input))
        return 'weapon';
    if (/weapon attack:/i.test(input))
        return 'weapon';
    if (/spell attack/i.test(input))
        return 'spell';
    if (/beginning at/i.test(input))
        return 'feat';
    if (/starting at/i.test(input))
        return 'feat';
    return 'feat';
}
function parsePossibleActionType(description) {
    if (/Melee Weapon Attack/.test(description))
        return 'mwak';
    if (/Ranged Weapon Attack/.test(description))
        return 'rwak';
    if (/spell save/i.test(description))
        return 'save';
    if (/saving throw/i.test(description))
        return 'save';
    return;
}
function abilityToLongShort(ability) {
    if (/str/i.test(ability))
        return ['str', 'strength'];
    if (/dex/i.test(ability))
        return ['dex', 'dexterity'];
    if (/con/i.test(ability))
        return ['con', 'constitution'];
    if (/int/i.test(ability))
        return ['int', 'intelligence'];
    if (/wis/i.test(ability))
        return ['wis', 'wisdom'];
    if (/cha/i.test(ability))
        return ['cha', 'charisma'];
    return ['', ''];
}
/**
 * @param name the name of the spell
 * @param description the description of the spell
 * @returns { value: number, charged: boolean }
 *
 * @example
 * parseSpell('Poison Breath (Recharge 5-6)', 'A poisonous gas cloud spreads from the dragon\'s mouth,
 */
function parseRecharge(name) {
    if (!name.toLowerCase().includes('recharge')) {
        throw new Error(`${name} is not a recharge spell`);
    }
    const [, recharge] = name.toLowerCase().split('recharge');
    let range = [];
    if (recharge.includes('-')) {
        range = recharge.split('-');
    }
    else if (recharge.includes('–')) {
        range = recharge.split('–');
    }
    const [lower, upper] = range;
    return {
        value: parseInt(lower),
        charged: upper ? true : false,
    };
}
function parseUses(name, description) {
    function parseDay(from) {
        const perDay = parseInt(from.split('/')[0].split('(')[1]);
        if (isNaN(perDay))
            return;
        return {
            per: 'day',
            value: perDay,
            max: perDay,
        };
    }
    if (/\/day/i.test(name)) {
        return parseDay(name);
    }
    if (/\/day/i.test(description)) {
        return parseDay(description);
    }
}
function parseTarget(description) {
    if (/radius/i.test(description)) {
        return {
            type: 'sphere',
            value: parseSpellSphere(description),
            units: 'ft',
        };
    }
    if (/cone/i.test(description)) {
        return {
            type: 'cone',
            value: parseSpellCone(description),
            units: 'ft',
        };
    }
    throw new Error(`Unable to parse target from ${description}`);
}
function parseToItem({ name, description, ability, section }) {
    const itemType = parseTypeFromActorFeature(description);
    let damage = undefined;
    try {
        damage = { parts: buildDamageParts(description) };
    }
    catch (_) {
        // spell doesn't require damage
    }
    const actionType = parsePossibleActionType(description);
    let save = undefined;
    if (actionType === 'save') {
        const rawDC = description?.split('DC')[1]?.trim()?.split(' ')[0]?.trim() ?? '';
        const uncleanAbility = description?.split(rawDC)[1]?.trim()?.split(' ')[0]?.trim() ?? '';
        const [short] = abilityToLongShort(uncleanAbility);
        ability = short;
        if (!rawDC)
            save = undefined;
        else {
            save = {
                ability: short,
                dc: parseInt(rawDC),
                scaling: 'flat',
            };
        }
    }
    let uses;
    try {
        uses = parseUses(name, description);
    }
    catch (_) {
        // uses can be undefined
    }
    let recharge;
    try {
        recharge = parseRecharge(name);
    }
    catch (_) {
        // recharge can be undefined
    }
    let target;
    try {
        target = parseTarget(description);
    }
    catch (_) {
        // target can be undefined
    }
    let range;
    try {
        range = parseRange(description);
    }
    catch (_) {
        // range can be undefined
    }
    return {
        name,
        type: itemType,
        ability,
        uses,
        save,
        recharge,
        description,
        activation: parseActivation(name, description, section),
        damage,
        actionType,
        range,
        attackBonus: 0,
        target,
    };
}
function parsedToWeapon(name, inputDescription, inputAbility) {
    const parsedWeapon = parseToItem({ name, description: inputDescription, ability: inputAbility });
    const { type, description, activation, damage, actionType, range, ability, attackBonus } = parsedWeapon;
    return {
        name,
        type,
        data: {
            description: {
                value: description,
            },
            activation,
            damage,
            actionType,
            range,
            ability,
            attackBonus: attackBonus?.toString(),
        },
    };
}

function parseName(input) {
    return input.split('\n')[0].trim();
}
function parseRarity(input) {
    if (/uncommon/i.test(input))
        return 'uncommon';
    if (/common/i.test(input))
        return 'common';
    if (/rare/i.test(input))
        return 'rare';
    if (/legendary/i.test(input))
        return 'legendary';
    return 'common';
}
function cleanDescription(description, extraItems) {
    return (extraItems
        .reduce((acc, item) => {
        const afterItem = acc.split(item)[1] || acc;
        return afterItem;
    }, description)
        .replace(/(\r\n|\n|\r)/gm, ' ')
        .trim() || description);
}
function processItem(input) {
    const type = parseType(input);
    const name = parseName(input);
    const rarity = parseRarity(input);
    // TODO: fix issue where type and rarity and such are still in the description
    const description = cleanDescription(input, [name, type, rarity]);
    switch (type) {
        case 'weapon':
        case 'feat':
            return parsedToWeapon(name, description);
        default:
            return {
                name,
                type,
                data: {
                    description: {
                        value: description,
                    },
                    rarity,
                },
            };
    }
}

async function handleInput(input) {
    const parsedItem = processItem(input);
    await Item.create({ ...parsedItem });
}
async function processItemInput({ jsonfile, clipboardInput }) {
    if (clipboardInput) {
        console.log(`Cliboard input: ${clipboardInput}`);
        handleInput(clipboardInput);
    }
}

const parseItem = ({ name, description, ability, section, }) => {
    try {
        const item = parseToItem({ name, description, ability, section });
        return item;
    }
    catch (e) {
        console.log(`Error parsing item: ${name} - ${e}`);
        throw new Error(`Failed to parse item: ${name}`);
    }
};

// type guard for SpellSlotKey
function isSpellSlotKey(key) {
    return (key === 'spell1' ||
        key === 'spell2' ||
        key === 'spell3' ||
        key === 'spell4' ||
        key === 'spell5' ||
        key === 'spell6' ||
        key === 'spell7' ||
        key === 'spell8' ||
        key === 'spell9' ||
        key === 'pact');
}
function getDefaultSpellSlots() {
    const defaultSpellSlots = {
        spell1: {
            value: '0',
            override: '0',
            max: '0',
        },
        spell2: {
            value: '0',
            override: '0',
            max: '0',
        },
        spell3: {
            value: '0',
            override: '0',
            max: '0',
        },
        spell4: {
            value: '0',
            override: '0',
            max: '0',
        },
        spell5: {
            value: '0',
            override: '0',
            max: '0',
        },
        spell6: {
            value: '0',
            override: '0',
            max: '0',
        },
        spell7: {
            value: '0',
            override: '0',
            max: '0',
        },
        spell8: {
            value: '0',
            override: '0',
            max: '0',
        },
        spell9: {
            value: '0',
            override: '0',
            max: '0',
        },
        pact: {
            value: '0',
            override: '0',
            max: '0',
            level: '0',
        },
    };
    return defaultSpellSlots;
}

function convertAbilities({ str, dex, con, int, wis, cha }) {
    return {
        str: {
            value: str.value,
            proficient: 0,
            bonuses: {
                save: `${str.savingThrow}`,
            },
        },
        dex: {
            value: dex.value,
            proficient: 0,
            saveBonus: dex.savingThrow,
            bonuses: {
                save: `${dex.savingThrow}`,
            },
        },
        con: {
            value: con.value,
            proficient: 0,
            saveBonus: con.savingThrow,
            bonuses: {
                save: `${con.savingThrow}`,
            },
        },
        int: {
            value: int.value,
            proficient: 0,
            saveBonus: int.savingThrow,
            bonuses: {
                save: `${int.savingThrow}`,
            },
        },
        wis: {
            value: wis.value,
            proficient: 0,
            saveBonus: wis.savingThrow,
            bonuses: {
                save: `${wis.savingThrow}`,
            },
        },
        cha: {
            value: cha.value,
            proficient: 0,
            saveBonus: cha.savingThrow,
            bonuses: {
                save: `${cha.savingThrow}`,
            },
        },
    };
}
function acToFifth({ value, type }) {
    const flat = value;
    let calc = 'flat';
    if (type.match(/natural armor/i)) {
        calc = 'natural';
    }
    else if (type.match(/leather armor/i)) {
        calc = 'equipped';
    }
    else if (type.match(/plate armor/i)) {
        calc = 'equipped';
    }
    else if (type.match(/mail armor/i)) {
        calc = 'equipped';
    }
    return {
        calc,
        flat,
    };
}
function convertAttributes({ armorClass, health, speed }, senses) {
    return {
        senses: {
            darkvision: senses?.darkvision,
            blindsight: senses?.blindsight,
            tremorsense: senses?.tremorsense,
            truesight: senses?.truesight,
            special: senses?.special,
            units: 'ft',
        },
        ac: acToFifth(armorClass),
        hp: {
            value: health.value,
            max: health.value,
            min: 0,
            formula: health?.formula,
        },
        movement: {
            units: 'ft',
            walk: speed,
        },
    };
}
function buildSkill(skill, ability) {
    const fifthSkill = {
        value: skill.bonus ? 1 : 0,
        mod: skill.bonus,
        total: skill.bonus,
        ability,
    };
    return fifthSkill;
}
function convertSkills(skills, senses) {
    const fifthSkills = {};
    skills.forEach((skill) => {
        const skillName = skill.name.toLowerCase().trim();
        switch (skillName) {
            case 'acrobatics':
                fifthSkills.acr = buildSkill(skill, 'dex');
                break;
            case 'animal handling':
                fifthSkills.ani = buildSkill(skill, 'wis');
                break;
            case 'arcana':
                fifthSkills.arc = buildSkill(skill, 'int');
                break;
            case 'athletics':
                fifthSkills.ath = buildSkill(skill, 'str');
                break;
            case 'deception':
                fifthSkills.dec = buildSkill(skill, 'cha');
                break;
            case 'history':
                fifthSkills.his = buildSkill(skill, 'int');
                break;
            case 'insight':
                fifthSkills.ins = buildSkill(skill, 'wis');
                break;
            case 'intimidation':
                fifthSkills.itm = buildSkill(skill, 'str');
                break;
            case 'investigation':
                fifthSkills.inv = buildSkill(skill, 'int');
                break;
            case 'medicine':
                fifthSkills.med = buildSkill(skill, 'wis');
                break;
            case 'nature':
                fifthSkills.nat = buildSkill(skill, 'int');
                break;
            case 'perception':
                fifthSkills.prc = buildSkill(skill, 'wis');
                fifthSkills.prc.passive = senses.passivePerception;
                break;
            case 'performance':
                fifthSkills.prf = buildSkill(skill, 'cha');
                break;
            case 'persuasion':
                fifthSkills.per = buildSkill(skill, 'cha');
                break;
            case 'religion':
                fifthSkills.rel = buildSkill(skill, 'int');
                break;
            case 'sleight of hand':
                fifthSkills.slt = buildSkill(skill, 'dex');
                break;
            case 'stealth':
                fifthSkills.ste = buildSkill(skill, 'dex');
                break;
            case 'survival':
                fifthSkills.sur = buildSkill(skill, 'wis');
                break;
        }
    });
    return fifthSkills;
}
function getMaxAbility(abilities) {
    if (abilities.str.mod > abilities.dex.mod)
        return 'str';
    return 'dex';
}
function convertSize(size) {
    if (size === 'Tiny')
        return 'tiny';
    if (size === 'Small')
        return 'sm';
    if (size === 'Medium')
        return 'med';
    if (size === 'Large')
        return 'lg';
    if (size === 'Huge')
        return 'huge';
    if (size === 'Gargantuan')
        return 'grg';
    return 'med';
}
function convertType(input) {
    const type = input.toLowerCase();
    let monsterType = 'unknown';
    if (/aberration/i.test(type))
        monsterType = 'aberration';
    if (/beast/i.test(type))
        monsterType = 'beast';
    if (/celestial/i.test(type))
        monsterType = 'celestial';
    if (/construct/i.test(type))
        monsterType = 'construct';
    if (/dragon/i.test(type))
        monsterType = 'dragon';
    if (/elemental/i.test(type))
        monsterType = 'elemental';
    if (/fey/i.test(type))
        monsterType = 'fey';
    if (/fiend/i.test(type))
        monsterType = 'fiend';
    if (/giant/i.test(type))
        monsterType = 'giant';
    if (/humanoid/i.test(type))
        monsterType = 'humanoid';
    if (/monstrosity/i.test(type))
        monsterType = 'monstrosity';
    if (/ooze/i.test(type))
        monsterType = 'ooze';
    if (/plant/i.test(type))
        monsterType = 'plant';
    if (/undead/i.test(type))
        monsterType = 'undead';
    if (monsterType === 'unknown') {
        if (/warforged/i.test(type))
            monsterType = 'humanoid';
        return {
            value: monsterType,
            subtype: '',
            swarm: '',
            custom: type.toLowerCase(),
        };
    }
    else {
        return {
            value: monsterType.toLowerCase(),
            subtype: '',
            swarm: '',
            custom: '',
        };
    }
}
function convertLanguage(language) {
    if (language === "thieves' cant")
        return 'cant';
    if (language === 'deep speech')
        return 'deep';
    return language;
}
function buildResistances(damageImmunities, conditionImmunities, damageResistances, damageVulnerabilities) {
    let resistances = {};
    if (damageImmunities.length > 0) {
        resistances = {
            ...resistances,
            di: { value: damageImmunities },
        };
    }
    if (conditionImmunities.length > 0) {
        resistances = {
            ...resistances,
            ci: { value: conditionImmunities },
        };
    }
    if (damageResistances.length > 0) {
        resistances = {
            ...resistances,
            dr: { value: damageResistances },
        };
    }
    if (damageVulnerabilities.length > 0) {
        resistances = {
            ...resistances,
            dv: { value: damageVulnerabilities },
        };
    }
    return resistances;
}
function actorToFifth({ abilities, armorClass, health, speed, biography, skills, rating, damageImmunities, damageResistances, conditionImmunities, damageVulnerabilities, size, senses, languages, alignment, type, spellcasting, }) {
    return {
        abilities: convertAbilities(abilities),
        attributes: convertAttributes({ armorClass, health, speed }, senses),
        details: {
            race: type,
            alignment,
            type: convertType(type),
            biography: {
                value: biography,
            },
            cr: rating?.cr,
            xp: {
                value: rating?.xp,
            },
        },
        traits: {
            size: convertSize(size),
            languages: {
                value: languages.map(convertLanguage),
            },
            ...buildResistances(damageImmunities, conditionImmunities, damageResistances, damageVulnerabilities),
        },
        skills: convertSkills(skills, senses),
        spellcasting,
        spells: {},
    };
}
function spellsToSpellSlots(spells, fifthSpells) {
    const defaultSlots = getDefaultSpellSlots();
    // remove atWill spells from the list as they dont count towards slots
    const spellsToCount = spells.filter((s) => !s.uses?.atWill);
    spellsToCount.forEach((spell) => {
        const spellLevel = fifthSpells.find((s) => s.name === spell.name)?.data.level;
        const spellSlotKey = `spell${spellLevel}`;
        if (!spellLevel || !isSpellSlotKey(spellSlotKey) || !defaultSlots[spellSlotKey])
            return;
        // spells are 1/day each etc, so we need to sum the uses
        const oldValue = defaultSlots[spellSlotKey].value ?? '0';
        const newValue = spell.uses?.value?.toString() || '0';
        const addedValue = Number(newValue) + Number(oldValue);
        const value = addedValue.toString() || '0';
        defaultSlots[spellSlotKey] = {
            value,
            max: value,
            override: value,
        };
    });
    return defaultSlots;
}

// For this type guard, we are okay with an any
// eslint-disable-next-line
function isAbilities(obj) {
    // make sure str.value, dex.value, etc. are all numbers (not NaN)
    const hasKeys = 'str' in obj && 'dex' in obj && 'con' in obj && 'int' in obj && 'wis' in obj && 'cha' in obj;
    if (!hasKeys)
        return false;
    if (isNaN(obj.str.value) ||
        isNaN(obj.dex.value) ||
        isNaN(obj.con.value) ||
        isNaN(obj.int.value) ||
        isNaN(obj.wis.value) ||
        isNaN(obj.cha.value)) {
        return false;
    }
    return true;
}
// Type guard for PF2eAbilities
// eslint-disable-next-line
function isPF2eAbilities(obj) {
    const hasKeys = 'str' in obj && 'dex' in obj && 'con' in obj && 'int' in obj && 'wis' in obj && 'cha' in obj;
    if (!hasKeys)
        return false;
    if (isNaN(obj.str.mod) ||
        isNaN(obj.dex.mod) ||
        isNaN(obj.con.mod) ||
        isNaN(obj.int.mod) ||
        isNaN(obj.wis.mod) ||
        isNaN(obj.cha.mod)) {
        return false;
    }
    return true;
}

const FEATURE_SECTIONS = [
    'ACTIONS',
    'FEATURES',
    'REACTIONS',
    'LEGENDARY ACTIONS',
    'BONUS ACTIONS',
    'VILLAIN ACTIONS',
    'UTILITY SPELLS',
];
const ParseActorWTC = {
    parseName: [parseNameWTC],
    parseRating: [parseRatingWTC, parseRatingMCDM],
    parseType: [parseTypeWTC],
    parseAlignment: [parseAlignmentWTC],
    parseBiography: [parseBiographyWTC],
    parseLanguages: [parseLanguagesWTC],
    parseSize: [parseSizeWTC],
    parseHealth: [parseHealthWTC],
    parseSenses: [parseSensesWTC],
    parseArmorClass: [parseACWTC],
    parseDamageImmunities: [parseDamageImmunitiesWTC],
    parseDamageResistances: [parseDamageResistancesWTC],
    parseConditionImmunities: [parseConditionImmunitiesWTC],
    parseDamageVulnerabilities: [parseDamageVulnerabilitiesWTC],
    parseAbilities: [
        parseAbilitiesWTC,
        parseMultiLineAbilitiesWTC,
        parseVerticalKeyValueAbilitiesWTC,
        parseVerticalNameValModFormatWTC,
        parseGPTBlockAbilities,
        parseInlineAbilityValueModWTC,
    ],
    parseSpeed: [parseSpeedWTC],
    parseSkills: [parseSkillsWTC],
    parseItems: [parseItemsWTC],
    parseSpells: [parseSpellsWTC],
    parseSpellcasting: [parseSpellcastingWTC],
};
const ABILITY_MAP = {
    str: 'strength',
    dex: 'dexterity',
    con: 'constitution',
    int: 'intelligence',
    wis: 'wisdom',
    cha: 'charisma',
};
const SHORT_ABILITY_MAP = {
    strength: 'str',
    dexterity: 'dex',
    constitution: 'con',
    intelligence: 'int',
    wisdom: 'wis',
    charisma: 'cha',
};
const pascal = (s) => s.replace(/(\w)(\w*)/g, function (_, g1, g2) {
    return g1.toUpperCase() + g2.toLowerCase();
});
function parseHealthWTC(lines) {
    let healthLine = lines.find((line) => line.toUpperCase().includes('HIT POINTS'));
    if (!healthLine)
        throw new Error('Could not find health line');
    healthLine = pascal(healthLine);
    let parsed = parseGenericFormula(healthLine.toLowerCase(), /hit points (.*)/);
    // above case is for pattern matching Hit Points 8 (1d6 + 2)
    // Match pattern Hit Points: Hit Points: 8 (1d6 + 2)
    if (!parsed?.value)
        parsed = parseGenericFormula(healthLine.toLowerCase(), /hit points: (.*)/);
    const { min, max, str, value } = parsed;
    const health = {
        min,
        max,
        value,
        formula: str,
    };
    if (!health.value) {
        throw new Error('Could not parse health from line: ' + healthLine);
    }
    return health;
}
function parseNameWTC(lines) {
    let name = lines[0].trim();
    name = name.toLowerCase().split(' cr ')[0];
    name = name.trim().split(' ').map(pascal).join(' ');
    return name;
}
function parseACWTC(lines) {
    let acString = lines.find((line) => line.toUpperCase().includes('ARMOR CLASS'));
    if (!acString) {
        acString = lines.find((line) => line.trim().toUpperCase().startsWith('AC'));
        if (!acString)
            throw new Error('Could not find AC line');
    }
    acString = pascal(acString);
    if (!acString || typeof acString !== 'string') {
        throw new Error('Could not find AC line');
    }
    // acString: Armor Class 17 (natural armor)
    // get string from between parentheses
    let ac = 'Natural Armor';
    if (acString.includes('(')) {
        const acArray = acString.match(/\(([^)]+)\)/);
        if (!acArray || acArray.length < 1) {
            throw new Error(`Could not parse armor type from string: ${acString} | array was: ${acArray}`);
        }
        // pull formula from match
        ac = acArray.length > 1 ? acArray[1] : 'Natural Armor';
    }
    // find number in string
    const acNumber = acString.match(/\d+/);
    if (!acNumber || acNumber.length < 1) {
        throw new Error(`Could not parse AC from string: ${acString} | number was: ${acNumber}`);
    }
    return {
        value: Number(acNumber[0]),
        type: ac.toLowerCase(),
    };
}
function parseAbilityScore(score, mod) {
    let modNumber = 0;
    if (!mod)
        return { value: score, mod: modNumber, savingThrow: 0 };
    if (mod.includes('-') || mod.includes('–')) {
        // extract number from the string
        const modNumberString = mod.match(/\d+/) || '0';
        modNumber = -1 * Number(modNumberString[0]);
    }
    else {
        modNumber = Number(mod);
    }
    return {
        value: score,
        mod: modNumber,
        savingThrow: 0,
    };
}
function isAbilityLine(line) {
    let isAbilityLine = true;
    isAbilityLine = isAbilityLine && line.toUpperCase().includes('STR');
    isAbilityLine = isAbilityLine && line.toUpperCase().includes('DEX');
    isAbilityLine = isAbilityLine && line.toUpperCase().includes('CON');
    isAbilityLine = isAbilityLine && line.toUpperCase().includes('INT');
    isAbilityLine = isAbilityLine && line.toUpperCase().includes('WIS');
    isAbilityLine = isAbilityLine && line.toUpperCase().includes('CHA');
    return isAbilityLine;
}
function containsAbility(line) {
    if (!line)
        return false;
    const abilities = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
    return (abilities.findIndex((ability) => {
        return line.trim().toUpperCase() === ability;
    }) !== -1);
}
function extractAbilityValues(valueLine) {
    let abilityValuesWithSpaces = valueLine.split(' ');
    // if there is weird formatting such as no space between the value and parens
    // like 7(-2), split using parens as well
    if (abilityValuesWithSpaces.length < 12) {
        abilityValuesWithSpaces = abilityValuesWithSpaces.flatMap((value) => value.split(/(?=\()/));
    }
    const abilityValues = abilityValuesWithSpaces.filter((item) => item.length > 0);
    const abilities = [];
    const modifiers = Array(6).fill('0');
    abilityValues.forEach((value) => {
        if (value.includes('(')) {
            modifiers[abilities.length - 1] = value.replace('(', '').replace(')', '').trim();
        }
        else {
            abilities.push(parseInt(value));
        }
    });
    return { abilities, modifiers };
}
function zipStats(abilityKeys, abilities, modifiers) {
    return abilityKeys.reduce((obj, k, i) => ({ ...obj, [k.toLowerCase()]: parseAbilityScore(abilities[i], modifiers[i]) }), {});
}
function parseAbilitiesWTC(inputList) {
    const abilityLine = inputList.find(isAbilityLine);
    if (!abilityLine) {
        throw new Error('Could not find ability line');
    }
    const abilityIndex = inputList.indexOf(abilityLine);
    const singleLine = /str/i.test(abilityLine);
    if (!singleLine) {
        throw new Error('Could not parse abilities from parseAbilitiesWTC');
    }
    // match 3 to 6 letters
    const abilityKeys = abilityLine.match(/\w{3,7}/g);
    if (!abilityKeys || abilityKeys.length < 6) {
        throw new Error('Could not find ability keys');
    }
    const valueLine = inputList[abilityIndex + 1];
    const { abilities, modifiers } = extractAbilityValues(valueLine);
    const finalAbilities = zipStats(abilityKeys, abilities, modifiers);
    if (!isAbilities(finalAbilities)) {
        throw new Error('Could not parse abilities from parseAbilitiesWTC');
    }
    return finalAbilities;
}
function indexOfAbility(lines, ability) {
    let firstIndex = 0;
    lines.forEach((line, index) => {
        if (line.trim().toLowerCase() === ability.trim().toLowerCase())
            firstIndex = index;
    });
    return firstIndex;
}
function parseMod(line) {
    const components = line.split(' ');
    return {
        value: Number(components[0]),
        mod: Number(components[1].replace('(', '').replace(')', '')),
        savingThrow: 0,
    };
}
function findAbilityBounds(input) {
    const lines = new Array(...input);
    const firstLine = lines.findIndex((line) => {
        return line.trim().toLowerCase() === 'str';
    });
    if (firstLine === undefined) {
        throw new Error('Could not find first line');
    }
    const remainingLines = lines.slice(firstLine, lines.length);
    let lastLine = remainingLines.findIndex((line) => {
        const trimArray = line.trim().split(' ');
        return trimArray.length > 3;
    }) + firstLine;
    if (lastLine === -1) {
        lastLine = lines.length;
    }
    return { firstLine, lastLine };
}
function parseMultiLineAbilitiesWTC(lines) {
    if (lines[indexOfAbility(lines, 'STR') + 1].trim().toUpperCase() === 'DEX') {
        throw new Error('Invalid format for multi line stat parsing.');
    }
    const parsed = {
        str: parseMod(lines[indexOfAbility(lines, 'STR') + 1]),
        dex: parseMod(lines[indexOfAbility(lines, 'DEX') + 1]),
        con: parseMod(lines[indexOfAbility(lines, 'CON') + 1]),
        int: parseMod(lines[indexOfAbility(lines, 'INT') + 1]),
        wis: parseMod(lines[indexOfAbility(lines, 'WIS') + 1]),
        cha: parseMod(lines[indexOfAbility(lines, 'CHA') + 1]),
    };
    if (!isAbilities(parsed)) {
        throw new Error('Could not parse abilities from parseMultilineAbilitiesWTC');
    }
    return parsed;
}
function getVerticalKeyValueAbilities(input) {
    const { firstLine, lastLine } = findAbilityBounds(input);
    const lines = input.slice(firstLine, lastLine);
    const keyEndIndex = lines.findIndex((line) => {
        return !containsAbility(line);
    });
    const keys = lines.slice(0, keyEndIndex).map((line) => line.trim().toLowerCase());
    const values = lines.slice(keyEndIndex, keyEndIndex + 6).map((line) => line.trim().toLowerCase());
    return { keys, values };
}
function parseVerticalKeyValueAbilitiesWTC(input) {
    const { keys, values } = getVerticalKeyValueAbilities(input);
    const { abilities, modifiers } = extractAbilityValues(values.join(' '));
    const zipped = zipStats(keys, abilities, modifiers);
    if (!isAbilities(zipped)) {
        throw new Error('Could not parse abilities with parseVerticalKeyValueAbilitiesWTC');
    }
    return zipped;
}
const ABILITIES_WTC = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const isAbilityKey = (key) => ABILITIES_WTC.includes(key.toLowerCase().trim());
// parse ability score of following format
// STR 18 (+4) DEX 13 (+1) CON 16 (+3) INT 10 (+0) WIS 10 (+0) CHA 10 (+0)
function parseInlineAbilityValueModWTC(input) {
    const abilityLine = input.find((line) => line.indexOf('STR') !== -1 && line.indexOf('DEX') !== -1);
    if (!abilityLine) {
        throw new Error('Could not find ability line');
    }
    const line = abilityLine.toUpperCase();
    if (line.indexOf('STR') === -1 || line.indexOf('DEX') === -1) {
        throw new Error('Could not parse abilities with parseInlineAbilityValueModWTC');
    }
    const abilities = ABILITIES_WTC;
    const valuesAndMods = line.split(' ').filter((value) => !isAbilityKey(value));
    // use the existing parser, just format it correctly
    const abilityArray = [abilities.join(' ').toUpperCase(), valuesAndMods.join(' ')];
    const builtAbilities = parseAbilitiesWTC(abilityArray);
    if (!isAbilities(builtAbilities)) {
        throw new Error('Could not parse abilities with parseInlineAbilityValueModWTC');
    }
    return builtAbilities;
}
function parseVerticalNameValModFormatWTC(input) {
    const { firstLine, lastLine } = findAbilityBounds(input);
    const lines = input.slice(firstLine, lastLine);
    const removedAbilities = lines.filter((line) => !containsAbility(line));
    const { abilities, modifiers } = extractAbilityValues(removedAbilities.join(' '));
    const parsed = zipStats(ABILITIES_WTC, abilities, modifiers);
    if (!isAbilities(parsed)) {
        throw new Error('Could not parse abilities with parseVerticalNameValModFormatWTC');
    }
    return parsed;
}
const findAbilityValueBounds = (input) => {
    // find the firstLine lastLine bounds for an ability string
    // the abilities are all on one line
    // like the below example:
    // STR 8 (-1) DEX 12 (+1) CON 12 (+1) INT 14 (+2) WIS 10 (+0) CHA 14 (+2)
    const indexWithAbility = input.findIndex((line) => line.toLowerCase().includes('str'));
    const lineWithAbility = input[indexWithAbility];
    if (!lineWithAbility) {
        throw new Error('Could not find line with ability');
    }
    const lineContainsTwoAbilities = (line) => {
        return line.toLowerCase().includes('str') && line.toLowerCase().includes('dex');
    };
    if (!lineContainsTwoAbilities(lineWithAbility)) {
        throw new Error('Line does not contain two abilities');
    }
    return indexWithAbility;
};
function parseGPTBlockAbilities(input) {
    const indexOfAbility = findAbilityValueBounds(input);
    const abilityLine = input[indexOfAbility];
    // abilityLine:
    // STR 8 (-1) DEX 12 (+1) CON 12 (+1) INT 14 (+2) WIS 10 (+0) CHA 14 (+2)
    const abilities = abilityLine.split(' ').reduce((acc, cur, index) => {
        if (index % 3 === 0) {
            const ability = cur.toLowerCase().trim();
            const value = Number(abilityLine.split(' ')[index + 1]);
            const mod = Number(abilityLine.split(' ')[index + 2].replace('(', '').replace(')', ''));
            acc[`${ability}`] = { value, mod, savingThrow: 0 };
        }
        return acc;
    }, {});
    if (!isAbilities(abilities)) {
        throw new Error('Could not parse abilities with parseGPTBlockAbilities');
    }
    return abilities;
}
function parseSpeedWTC(lines) {
    const speedLine = lines.find((line) => line.toUpperCase().includes('SPEED'));
    if (!speedLine) {
        throw new Error('Could not find speed line');
    }
    const speed = speedLine.match(/\d+/);
    if (!speed || speed.length < 1) {
        throw new Error('Could not find speed');
    }
    return Number(speed[0]);
}
function parseSkillsWTC(lines) {
    let skillLine = lines.find((line) => line.toUpperCase().includes('SKILL'));
    if (!skillLine) {
        throw new Error('Could not find skill line');
    }
    skillLine = skillLine.replace(/skills/i, '');
    const skillKeys = skillLine.match(/\w{3,13}/g);
    if (!skillKeys || skillKeys.length < 1) {
        throw new Error('Could not find skill keys');
    }
    const skillValues = skillLine.match(/\d+/g);
    if (!skillValues || skillValues.length < 1) {
        throw new Error('Could not find skill values');
    }
    const skills = skillKeys.map((value, index) => {
        return {
            name: value.toLowerCase(),
            bonus: Number(skillValues[index]),
        };
    });
    return skills;
}
function addSavingThrows(lines, abilities) {
    const savingThrowsLine = lines.find((line) => line.toUpperCase().includes('SAVING THROWS'));
    if (!savingThrowsLine) {
        return abilities;
    }
    const savingThrowsArray = savingThrowsLine.replace('Saving Throws', '').trim().split(' ');
    const abilityList = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    savingThrowsArray.forEach((check, index) => {
        if (abilityList.includes(check.toLowerCase())) {
            const strNumber = savingThrowsArray[index + 1].replace('+', '');
            const parsedNumber = parseInt(strNumber);
            if (check.toLowerCase() === 'str') {
                abilities.str.savingThrow = parsedNumber - abilities.str.mod;
            }
            else if (check.toLowerCase() === 'dex') {
                abilities.dex.savingThrow = parsedNumber - abilities.dex.mod;
            }
            else if (check.toLowerCase() === 'con') {
                abilities.con.savingThrow = parsedNumber - abilities.con.mod;
            }
            else if (check.toLowerCase() === 'int') {
                abilities.int.savingThrow = parsedNumber - abilities.int.mod;
            }
            else if (check.toLowerCase() === 'wis') {
                abilities.wis.savingThrow = parsedNumber - abilities.wis.mod;
            }
            else if (check.toLowerCase() === 'cha') {
                abilities.cha.savingThrow = parsedNumber - abilities.cha.mod;
            }
        }
    });
    return abilities;
}
const isMCDMVillainAction = (name) => {
    return name.includes('Action 1:') || name.includes('Action 2:') || name.includes('Action 3:');
};
const gptClean = (line) => {
    if (line.trim().startsWith('- ')) {
        return line.trim().replace('- ', '');
    }
    return line.trim();
};
function getFeatureWithEnding(input, ending) {
    const line = gptClean(input);
    const wordsRequiredForName = 4;
    // match 1 or 2 words in a row that start with a capital letters and ending
    // in a period
    const regString = `\\b[A-Z]{1}[a-z]{1,}\\b\\${ending}`;
    const re = new RegExp(regString, 'g');
    // Remove parens and content inside, and leading space
    // Poison Recharge (5-6). Some text -> Poison Recharge. Some text
    const parenRegex = / \(([^)]+)\)/;
    const lineWithoutParens = line.replace(parenRegex, '');
    const reduceOutWords = (acc, word) => {
        acc = acc.replace(` ${word} `, ' ');
        acc = acc.replace(`${word}`, '');
        return acc;
    };
    // Remove any characters that don't factor into our name regex
    // don't pull out the denominator we are attempting to split on
    let ignoredSubstrings = ['of', 'the', 'and', ',', '!', '.'];
    ignoredSubstrings = ignoredSubstrings.filter((substr) => substr !== ending);
    const cleanedForName = ignoredSubstrings.reduce(reduceOutWords, lineWithoutParens).replace(')', '');
    const matches = cleanedForName.match(re);
    if (matches) {
        const name = line.split(ending)[0];
        // If our regex didn't grab a match at the beginning of the line, return
        const nameWithoutConjunctions = ignoredSubstrings.reduce(reduceOutWords, name);
        if (nameWithoutConjunctions.replace(parenRegex, '').trim().split(' ').length > wordsRequiredForName) {
            return;
        }
        if (isMCDMVillainAction(name))
            return;
        return name;
    }
    return undefined;
}
const isGPTName = (line) => {
    return line.trim().startsWith('-');
};
function getFeatureName(line) {
    if (isGPTName(line)) {
        return getFeatureWithEnding(line, ':');
    }
    return getFeatureWithEnding(line, '.') ?? getFeatureWithEnding(line, '!');
}
const WTC_TO_FOUNDRY_SECTION_MAP = {
    ACTIONS: 'action',
    UTILITY: 'action',
    REACTIONS: 'reaction',
    'BONUS ACTIONS': 'bonus',
    'LEGENDARY ACTIONS': 'legendary',
    'VILLAIN ACTIONS': 'legendary',
};
function fromFoundrySection(section) {
    if (!section) {
        return;
    }
    let foundKey;
    Object.entries(WTC_TO_FOUNDRY_SECTION_MAP).forEach(([key, value]) => {
        if (value === section && foundKey === undefined) {
            foundKey = key;
        }
    });
    return foundKey;
}
function toSection(line) {
    const name = line.toUpperCase();
    if (name in WTC_TO_FOUNDRY_SECTION_MAP) {
        return WTC_TO_FOUNDRY_SECTION_MAP[name];
    }
    return;
}
function reduceToFeatures(acc, curr, sections) {
    const line = curr.trim();
    if (line.trim() === '')
        return acc;
    if (sections.includes(line.toUpperCase())) {
        acc.push(line.toUpperCase());
        return acc;
    }
    const names = getFeatureName(line);
    if (names || acc.length === 0) {
        acc.push(line.trim());
    }
    else {
        // the next line after 'legendary resistance' is a description of the
        // resistance, so the section header gets lost
        // need to check if the previous line was a section header, and if so
        // create a new entry including the previous header
        const lastEntry = acc[acc.length - 1];
        if (sections.includes(lastEntry.toUpperCase()) && line) {
            const stitchedFeature = `${pascal(lastEntry)}. ${line.trim()}`;
            acc.push(stitchedFeature);
            return acc;
        }
        // if the line was a continuation, dont add a space
        const bindWith = acc[acc.length - 1].endsWith('-') ? '' : ' ';
        // if line ended with a - for a continuation, remove it
        if (acc[acc.length - 1].endsWith('-')) {
            acc[acc.length - 1] = acc[acc.length - 1].slice(0, -1);
        }
        acc[acc.length - 1] = acc[acc.length - 1].trim() + bindWith + line.trim();
    }
    acc[acc.length - 1] = acc[acc.length - 1].trim();
    return acc;
}
function featureStringsToFeatures(line, sectionName) {
    const fetchedName = getFeatureName(line);
    let name = '';
    if (!fetchedName)
        name = sectionName ?? '';
    else
        name = fetchedName.trim();
    let cleanLine = line.replace(name, '').trim();
    if (cleanLine.startsWith('.'))
        cleanLine = cleanLine.substring(1);
    if (cleanLine.startsWith(' '))
        cleanLine = cleanLine.substring(1);
    cleanLine.replace('-\n', '');
    const feature = {
        name,
        description: cleanLine,
        section: sectionName,
    };
    return feature;
}
function parseBiographyWTC(lines) {
    let firstBioIndex = -1;
    lines.forEach((line, index) => {
        if (firstBioIndex === -1 && line.toUpperCase().includes('MEDIUM'  )) {
            firstBioIndex = index;
        }
    });
    if (firstBioIndex === -1) {
        throw new Error('Could not find a valid biography');
    }
    return lines[firstBioIndex].trim();
}
function parseRatingMCDM(lines) {
    const challengeLine = lines.find((line) => line.includes('CR'));
    if (!challengeLine) {
        throw new Error('Could not find a valid challenge rating');
    }
    const cr = challengeLine.split(' ').find((number) => {
        try {
            return parseInt(number) >= 0;
        }
        catch (e) {
            return false;
        }
    });
    if (!cr) {
        throw new Error('Could not find a valid challenge rating');
    }
    const xpLine = lines.find((line) => line.includes('XP'));
    if (!xpLine) {
        throw new Error('Could not find a valid experience rating');
    }
    const xp = xpLine.split(' ').find((number) => {
        try {
            return parseInt(number) >= 0;
        }
        catch (e) {
            return false;
        }
    });
    if (!xp) {
        throw new Error('Could not find a valid experience rating');
    }
    return {
        cr: parseInt(cr),
        xp: parseInt(xp),
    };
}
function parseRatingWTC(lines) {
    const challengeLine = lines.find((line) => line.includes('Challenge'));
    if (!challengeLine)
        throw new Error('could not parse challenge');
    // challengeLine : Challenge 1 (200 XP)
    // get the first number in the line
    const ratingString = challengeLine.split(' ')[1];
    let cr = 0;
    if (ratingString.includes('/')) {
        const [num, denom] = ratingString.split('/');
        cr = Number(num) / Number(denom);
    }
    else {
        if (Number(ratingString))
            cr = Number(ratingString);
    }
    // get the number in the parentheses
    const xp = Number(challengeLine.split('(')[1].split(')')[0].replace('xp', '').replace('XP', '').replace(',', ''));
    return {
        cr,
        xp,
    };
}
function getListRelated(to, inStrings) {
    const conditionImmunityLineIndex = inStrings.findIndex((line) => line.toLowerCase().includes(to));
    if (conditionImmunityLineIndex === -1)
        return;
    let conditionImmunityLine = inStrings[conditionImmunityLineIndex];
    let remaining = inStrings;
    if (inStrings.length > conditionImmunityLineIndex) {
        remaining = inStrings.slice(conditionImmunityLineIndex + 1);
    }
    let iter = 0;
    while (containsMoreItems(remaining[iter])) {
        conditionImmunityLine = conditionImmunityLine + ' ' + remaining[iter];
        iter++;
    }
    return conditionImmunityLine;
}
/*
 * List name, i.e. 'damage immunities'
 */
function parseNamedList(lines, listName) {
    const nameWithWordsCapitalized = listName
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    const listDataLine = getListRelated(listName, lines);
    if (!listDataLine)
        throw new Error(`could not parse ${listName}`);
    return listDataLine
        .replace(nameWithWordsCapitalized, '')
        .replace('and', '')
        .trim()
        .split(',')
        .map((value) => value.trim())
        .filter((line) => line !== '');
}
function parseDamageImmunitiesWTC(lines) {
    return parseNamedList(lines, 'damage immunities');
}
function parseDamageResistancesWTC(lines) {
    return parseNamedList(lines, 'damage resistances');
}
function containsMoreItems(line) {
    if (!line)
        return false;
    return line.split(',').length > 1 && line.split(',')[0].trim().split(' ').length === 1;
}
function parseConditionImmunitiesWTC(lines) {
    return parseNamedList(lines, 'condition immunities');
}
function parseDamageVulnerabilitiesWTC(lines) {
    return parseNamedList(lines, 'damage vulnerabilities');
}
function addSectionReduction(acc, feature) {
    if (FEATURE_SECTIONS.includes(feature)) {
        // this is a section label, not a feature
        acc.push({ section: toSection(feature), feature: 'EMPTY' });
    }
    const lastAdded = acc[acc.length - 1];
    // this is an un populated feature
    if (lastAdded && lastAdded.section && lastAdded.feature === 'EMPTY') {
        lastAdded.feature = feature;
        return acc;
    }
    // Use the last added section for this feature section
    if (lastAdded && lastAdded.section) {
        const { section } = lastAdded;
        acc.push({ section, feature });
        return acc;
    }
    acc.push({ feature });
    return acc;
}
const mcdmClean = (description) => {
    if (description.includes('Action 1:') && description.includes('Action 2:')) {
        return description.replace(/Action \d:/g, (match) => {
            // split match on the number
            const afterColon = match.split(':')[1];
            const trimColon = match.split(':')[0];
            const number = trimColon.split(' ')[1];
            return `<br><b>Action ${number}:</b> ${afterColon}`;
        });
    }
    return description;
};
const getMCDMChangingLine = (lines) => {
    return lines.find((line) => line.includes('CHANGING THE'));
};
const getFeatureMatching = (lines, pattern) => {
    const name = pattern.replace(':', '');
    const gptFeatures = [];
    const spellsIndex = lines.findIndex((line) => line.includes(pattern));
    if (spellsIndex === -1)
        return [];
    const spells = lines[spellsIndex + 1];
    gptFeatures.push({
        name,
        description: spells,
        section: 'action',
    });
    return gptFeatures;
};
const getGPTFeatures = (lines) => {
    return [
        ...getFeatureMatching(lines, 'Spells:'),
        ...getFeatureMatching(lines, 'Equipment:'),
        ...getFeatureMatching(lines, 'Spellcasting:'),
    ];
};
function parseFeaturesWTC(lines) {
    const changingLine = getMCDMChangingLine(lines)?.trim();
    let formattedLines = lines;
    // add a section for 'changing the monster' if the section exists
    if (changingLine) {
        formattedLines = lines.map((line) => line.replace(changingLine, `${pascal(changingLine)}.`));
    }
    // Remove the spellcasting section
    const [start, end] = getSpellcastingRange(formattedLines);
    if (start !== -1 && end !== -1) {
        formattedLines = formattedLines.slice(0, start).concat(formattedLines.slice(end));
    }
    const firstFeatureLine = formattedLines.findIndex((line) => getFeatureName(line) !== undefined);
    if (firstFeatureLine === -1)
        throw new Error('Could not find a valid feature');
    const featureLines = formattedLines.slice(firstFeatureLine);
    const featureStrings = featureLines.reduce((acc, curr) => reduceToFeatures(acc, curr, FEATURE_SECTIONS), []);
    const withSections = featureStrings.reduce(addSectionReduction, []);
    let compiledFeatures = withSections.map((entry) => featureStringsToFeatures(entry.feature, entry.section));
    compiledFeatures = compiledFeatures.filter((feature) => {
        feature.description = mcdmClean(feature.description);
        return feature;
    });
    compiledFeatures = compiledFeatures.filter((feature) => feature.description !== ''); // remove empty features
    compiledFeatures = compiledFeatures.filter((feature) => !FEATURE_SECTIONS.includes(feature.description.toUpperCase()));
    // add section to last part of description in case foundry doesn't keep it
    const interestingSections = ['bonus', 'legendary', 'reaction'];
    compiledFeatures = compiledFeatures.map((feature) => {
        const fromFoundry = fromFoundrySection(feature.section);
        if (feature.section && interestingSections.includes(feature.section) && fromFoundry) {
            feature.description = `${pascal(fromFoundry)}: ${feature.description}`;
        }
        return feature;
    });
    compiledFeatures = compiledFeatures.filter((feature) => {
        return !FEATURE_SECTIONS.includes(feature.description) || feature.description === feature.name;
    });
    const gptFeatures = getGPTFeatures(lines);
    return [...compiledFeatures, ...gptFeatures];
}
function parseItemsWTC(lines, abilities) {
    const features = parseFeaturesWTC(lines);
    return features.map(({ name, description, section }) => {
        return parseItem({ name, description, ability: getMaxAbility(abilities), section });
    });
}
function getSpellcastingRange(lines) {
    // Find the index of the "Spellcasting." line
    const spellcastingIndex = lines.findIndex((line) => line.startsWith('Spellcasting') || line.startsWith('Innate Spellcasting'));
    if (spellcastingIndex === -1) {
        return [-1, -1];
    }
    // Find the start and end indexes of the spellcasting block
    const startIndex = spellcastingIndex + 1;
    function isEndIndex(line) {
        const startsWithFeature = FEATURE_SECTIONS.some((feature) => line.toUpperCase().startsWith(feature));
        return startsWithFeature;
    }
    // find isEndIndex after the spellcastingIndex, dont look at lines before the spellcastingIndex
    const spliced = [...lines];
    let endIndex = spliced.splice(spellcastingIndex).findIndex(isEndIndex);
    endIndex = endIndex === -1 ? lines.length : endIndex + spellcastingIndex;
    // If the end index is not found, set it to the end of the lines array
    if (endIndex === -1) {
        endIndex = lines.length;
    }
    return [startIndex, endIndex];
}
function extractSpells(lines) {
    let spells = [];
    const [startIndex, endIndex] = getSpellcastingRange(lines);
    // If the "Spellcasting." line is not found, return an empty array
    if (startIndex === -1) {
        return spells;
    }
    // Loop through the lines in the spellcasting block
    for (let i = startIndex; i < endIndex; i++) {
        const line = lines[i].trim();
        // Ignore blank lines and lines that don't contain a spell name
        if (line === '' || !line.includes(':')) {
            continue;
        }
        const checkLine = line.toLowerCase();
        const hasSpellInfo = checkLine.includes('at will') ||
            checkLine.includes('each day') ||
            checkLine.includes('each time') ||
            checkLine.includes('day each');
        if (!hasSpellInfo) {
            continue;
        }
        // Extract the spell name and uses information
        const [usesText, parsedNames] = line.split(':');
        const split = parsedNames.split('and uses');
        const namesString = split[0].trim();
        const matches = usesText
            .replace(/ /g, '')
            .toLowerCase()
            .match(/(\d+\/day each|\d+\/day|\batwill\b)/i);
        if (matches === null)
            continue;
        const usesMatch = matches[0].replace('atwill', 'at will');
        if (usesMatch) {
            const names = namesString.split(',').map((name) => name.trim());
            let atWill = false;
            let per = 'day';
            let value = 1;
            if (usesMatch.includes('at will')) {
                atWill = true;
            }
            else {
                const [valueString, perString] = usesMatch.split('/');
                value = parseInt(valueString);
                per = perString;
            }
            for (const name of names) {
                // remove all parentheses and their contents in the name
                const cleanedName = name.replace(/\(.*?\)/g, '').trim();
                spells.push({
                    name: pascal(cleanedName),
                    type: 'spell',
                    uses: {
                        per,
                        atWill,
                        value,
                    },
                });
            }
        }
    }
    spells = spells.filter((spell) => spell.name !== '');
    return spells;
}
function parseSpellsWTC(lines) {
    return extractSpells(lines);
}
function parseSpellcastingWTC(lines) {
    const [startIndex, endIndex] = getSpellcastingRange(lines);
    const oneLine = lines.slice(startIndex, endIndex).join(' ');
    const longNameAbilities = Object.values(ABILITY_MAP);
    // if a longName is case insensitive in the string, use it
    const ability = longNameAbilities.find((longName) => oneLine.toLowerCase().includes(longName.toLowerCase()));
    if (!ability)
        return;
    // return the short name of the ability
    return SHORT_ABILITY_MAP[ability];
}
function parseSensesWTC(lines) {
    const sensesLine = lines.find((line) => line.toLowerCase().includes('senses')) || '';
    if (!sensesLine)
        throw new Error('Could not find senses');
    const rawSenses = sensesLine.replace('Senses', '').replace('and', '').trim().split(',');
    const senses = { units: 'ft' };
    rawSenses.forEach((sense) => {
        if (sense === '')
            return;
        let [text, special] = [sense, ''];
        // remove parens and get text inside
        if (sense.includes('(')) {
            [text, special] = sense.split('(');
            senses.special = special.replace(')', '');
        }
        // get number from string of form darkvision 60ft
        // get regex for number in text
        const numberRegex = /\d+/;
        const matches = text.match(numberRegex);
        let number = 0;
        if (!matches) {
            return;
        }
        else {
            number = Number(matches[0]);
        }
        if (/darkvision/.test(sense)) {
            senses.darkvision = number;
        }
        else if (/blindsignt/i.test(sense)) {
            senses.blindsight = number;
        }
        else if (/tremorsense/i.test(sense)) {
            senses.tremorsense = number;
        }
        else if (/truesight/i.test(sense)) {
            senses.truesight = number;
        }
        else if (/passive/i.test(sense)) {
            senses.passivePerception = number;
        }
    });
    senses.units = 'ft';
    return senses;
}
function getDescriptionLine(lines) {
    const candidateLines = lines.slice(0, 8);
    const sizes = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];
    let descriptionLine = '';
    sizes.forEach((size) => {
        const potentialMatch = candidateLines.find((line) => {
            return line.toLowerCase().includes(size.toLowerCase());
        }) || '';
        if (potentialMatch !== '') {
            descriptionLine = potentialMatch;
        }
    });
    return descriptionLine;
}
function parseSizeWTC(lines) {
    const candidateLines = lines.slice(0, 8);
    const sizes = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];
    const size = sizes.find((size) => {
        const sizeInLine = candidateLines.findIndex((line) => {
            const includes = line.toLowerCase().includes(size.toLowerCase());
            return includes;
        }) !== -1;
        return sizeInLine;
    });
    if (!size)
        throw new Error('Could not parse size');
    return size;
}
function parseTypeWTC(lines) {
    const descriptionLine = getDescriptionLine(lines);
    // type is in string before parens and before comma
    if (descriptionLine.includes('(')) {
        const type = descriptionLine.split('(')[0].trim().split(' ').pop();
        if (!type)
            throw new Error(`Could not parse type from ${descriptionLine}`);
        return type;
    }
    const type = descriptionLine.split(',')[0].trim().split(' ').pop();
    if (!type)
        throw new Error(`Could not parse type from ${descriptionLine}`);
    return type;
}
function capitalizeBeginings(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
    });
}
function parseAlignmentWTC(lines) {
    const descriptionLine = getDescriptionLine(lines);
    return capitalizeBeginings(descriptionLine.split(',')[1].trim().toLowerCase());
}
function parseLanguagesWTC(lines) {
    const languageLine = lines.find((line) => line.toLowerCase().includes('languages')) || '';
    if (!languageLine)
        throw new Error(`Could not find language line in ${lines}`);
    const languages = languageLine.replace('Languages', '').replace('and', '').trim().split(',');
    return languages.map((language) => language.trim().toLowerCase());
}

const ACTOR_PARSERS = [ParseActorWTC];

function damageTypeGuard(damageTypes) {
    if (Array.isArray(damageTypes)) {
        return damageTypes;
    }
    throw new Error('Damage types must be an array');
}
function trySingleActorParse(parser, lines) {
    const abilities = tryParser(parser.parseAbilities, lines, (abilities) => {
        if (abilities.str) {
            const abilitiesWithSaves = addSavingThrows(lines, abilities);
            return abilitiesWithSaves;
        }
        throw new Error('Abilities must be of type Abilities');
    });
    return {
        name: tryParser(parser.parseName, lines, (value) => {
            if (typeof value === 'string') {
                return value;
            }
            else
                throw new Error('Name must be string');
        }),
        rating: tryParser(parser.parseRating, lines, (value) => {
            if (value.xp) {
                return value;
            }
            else {
                throw new Error('Rating must be of type Rating');
            }
        }, {
            isOptional: true,
            defaultValue: {
                xp: 0,
                cr: 0,
            },
        }),
        type: tryParser(parser.parseType, lines, (value) => {
            if (typeof value !== 'string') {
                throw new Error(`Could not parse type: ${value}`);
            }
            return value;
        }, {
            isOptional: true,
            defaultValue: '',
        }),
        alignment: tryParser(parser.parseAlignment, lines, (alignment) => {
            if (typeof alignment === 'string') {
                return alignment;
            }
            throw new Error('Alignment must be string');
        }, {
            isOptional: true,
            defaultValue: '',
        }),
        biography: tryParser(parser.parseBiography, lines, (biography) => {
            if (typeof biography === 'string') {
                return biography;
            }
            throw new Error('Biography must be string');
        }, {
            isOptional: true,
            defaultValue: '',
        }),
        languages: tryParser(parser.parseLanguages, lines, (languages) => {
            if (!Array.isArray(languages)) {
                throw new Error(`Could not parse languages: ${languages}`);
            }
            return languages;
        }, {
            isOptional: true,
            defaultValue: [],
        }),
        size: tryParser(parser.parseSize, lines, (size) => {
            if (typeof size !== 'string') {
                throw new Error(`Could not parse size: ${size}`);
            }
            return size;
        }, {
            isOptional: true,
            defaultValue: 'Medium',
        }),
        health: tryParser(parser.parseHealth, lines, (health) => {
            if (!health.value) {
                throw new Error(`Could not parse health: ${health}`);
            }
            return health;
        }),
        senses: tryParser(parser.parseSenses, lines, (senses) => {
            if (!senses.units) {
                throw new Error(`Could not parse senses: ${senses}`);
            }
            return senses;
        }),
        armorClass: tryParser(parser.parseArmorClass, lines, (armorClass) => {
            if (!armorClass.value) {
                throw new Error(`Could not parse armor class: ${armorClass}`);
            }
            return armorClass;
        }),
        damageImmunities: tryParser(parser.parseDamageImmunities, lines, damageTypeGuard, {
            isOptional: true,
            defaultValue: [],
        }),
        damageResistances: tryParser(parser.parseDamageResistances, lines, damageTypeGuard, {
            isOptional: true,
            defaultValue: [],
        }),
        conditionImmunities: tryParser(parser.parseConditionImmunities, lines, (conditionImmunities) => {
            if (Array.isArray(conditionImmunities)) {
                // Condition immunities are optional
                return conditionImmunities;
            }
            throw new Error(`Could not parse condition immunities: ${conditionImmunities}`);
        }, {
            isOptional: true,
            defaultValue: [],
        }),
        damageVulnerabilities: tryParser(parser.parseDamageVulnerabilities, lines, damageTypeGuard, {
            isOptional: true,
            defaultValue: [],
        }),
        abilities,
        speed: tryParser(parser.parseSpeed, lines, (speed) => {
            if (typeof speed === 'number') {
                return speed;
            }
            throw new Error('Speed must be number');
        }),
        skills: tryParser(parser.parseSkills, lines, (skills) => {
            if (Array.isArray(skills)) {
                return skills;
            }
            throw new Error('Skills must be array');
        }, {
            isOptional: true,
            defaultValue: [],
        }),
        items: tryParseItems(parser.parseItems, lines, abilities),
        spells: tryParseSpells(parser.parseSpells, lines),
        spellcasting: tryParseSpellcasting(parser.parseSpellcasting, lines),
    };
}
function tryActorParse(parsers, lines) {
    const parserErrors = [];
    for (const parser of parsers) {
        try {
            const result = trySingleActorParse(parser, lines);
            return result;
        }
        catch (error) {
            parserErrors.push(error);
        }
    }
    throw new Error(`Could not parse actor, errors: [${parserErrors.join(', ')}]`);
}
function tryParsers(parsers, input) {
    const parserErrors = [];
    for (const parser of parsers) {
        try {
            const result = parser(input);
            return result;
        }
        catch (error) {
            parserErrors.push(`Parser error for [${parser.name}] -> ${error}`);
        }
    }
    throw new Error(`Could not parse element: ${JSON.stringify(parserErrors.join('\n'), null, 2)}`);
}
function tryParser(parsers, lines, typeGuard, optional) {
    const parserErrors = [];
    for (const parser of parsers) {
        try {
            const result = parser(lines);
            return typeGuard(result);
        }
        catch (error) {
            parserErrors.push(`Parser error for [${parser.name}] -> ${error}`);
        }
    }
    if (optional && optional.isOptional) {
        return optional.defaultValue;
    }
    else {
        throw new Error(`Could not parse element: ${JSON.stringify(parserErrors.join('\n'), null, 2)}`);
    }
}
function tryItemParsers(parsers, input, abilities) {
    const parserErrors = [];
    for (const parser of parsers) {
        try {
            const result = parser(input, abilities);
            return result;
        }
        catch (error) {
            parserErrors.push(error);
        }
    }
    throw new Error(`Could not parse element: ${JSON.stringify(parserErrors.join('\n'), null, 2)}`);
}
function tryParseItems(parsers, lines, abilities) {
    const items = tryItemParsers(parsers, lines, abilities);
    if (!Array.isArray(items)) {
        throw new Error(`Could not parse items: ${items}`);
    }
    return items;
}
function tryParseSpells(parsers, lines) {
    const spells = tryParsers(parsers, lines);
    if (!Array.isArray(spells)) {
        throw new Error(`Could not parse spells: ${spells}`);
    }
    return spells;
}
function tryParseSpellcasting(parsers, lines) {
    const spellcasting = tryParsers(parsers, lines);
    if (typeof spellcasting !== 'string') {
        return '';
    }
    return spellcasting;
}

function textToActor(input) {
    const lines = input.split('\n');
    return tryActorParse(ACTOR_PARSERS, lines);
}

const ParseActorPF2e = {
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
function parseNamePF2e(lines) {
    const firstLine = lines[0];
    if (!firstLine)
        throw new Error('Could not find name line');
    // Remove "Creature X" part - must be at end with spaces before
    // Matches both "Name    Creature 5" and "Name creature 0"
    const match = firstLine.match(/^(.+?)\s+Creature\s+([-\d]+)\s*$/i);
    if (!match)
        throw new Error('Could not find "Name Creature Level" pattern in: ' + firstLine);
    const name = match[1].trim();
    if (!name)
        throw new Error('Could not parse name');
    return name;
}
/**
 * Parse simple name (alternative format without "Creature" keyword)
 * Format: "Test Simple Monster 5" (where 5 is just a trailing number, not "Creature 5")
 * This is a fallback parser for non-standard formats
 */
function parseSimpleNamePF2e(lines) {
    const firstLine = lines[0];
    if (!firstLine)
        throw new Error('Empty input - could not find name line');
    // Extract name and level separately
    // Match "Name Number" where Number is the level at the end
    const match = firstLine.match(/^(.+?)\s+([-\d]+)\s*$/i);
    if (!match)
        throw new Error('Could not find "Name Level" pattern in line: ' + firstLine);
    const name = match[1].trim();
    if (!name)
        throw new Error('Could not parse name from line: ' + firstLine);
    return name;
}
/**
 * Parse creature level from first line
 * Format: "Phantasmal Minion       Creature -1"
 */
function parseLevelPF2e(lines) {
    const firstLine = lines[0];
    if (!firstLine)
        throw new Error('Empty input - could not find level line');
    const levelMatch = firstLine.match(/Creature\s+([-\d]+)/i);
    if (!levelMatch)
        throw new Error('Could not find "Creature X" pattern in: ' + firstLine);
    return parseInt(levelMatch[1], 10);
}
/**
 * Parse simple level (just trailing number)
 * Format: "Test Simple Creature 0"
 */
function parseSimpleLevelPF2e(lines) {
    const firstLine = lines[0];
    if (!firstLine)
        throw new Error('Empty input - could not find level line');
    const levelMatch = firstLine.match(/([-\d]+)\s*$/i);
    if (!levelMatch)
        throw new Error('Could not find level number at end of line: ' + firstLine);
    return parseInt(levelMatch[1], 10);
}
/**
 * Parse companion level (no level in stat block, default to 0)
 * Format: "PRECIOUS" (companions don't have explicit level)
 */
function parseCompanionLevelPF2e(lines) {
    // Companions typically don't have a level in their stat block
    // Return 0 as default
    return 0;
}
/**
 * Parse companion name (just first line without level)
 * Format: "PRECIOUS"
 */
function parseCompanionNamePF2e(lines) {
    const firstLine = lines[0];
    if (!firstLine)
        throw new Error('Empty input - could not find name line');
    const name = firstLine.trim();
    if (!name)
        throw new Error('Could not parse name from empty line');
    return name;
}
/**
 * Parse size from second line (first word)
 * Format: "Medium Force Mindless"
 */
function parseSizePF2e(lines) {
    const sizeLine = lines[1];
    if (!sizeLine)
        throw new Error('Could not find size line (line 2)');
    const firstWord = sizeLine.trim().split(/\s+/)[0];
    const sizeMap = {
        tiny: 'Tiny',
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
        huge: 'Huge',
        gargantuan: 'Gargantuan',
    };
    const size = sizeMap[firstWord.toLowerCase()];
    if (!size)
        throw new Error(`Could not parse size from first word "${firstWord}" in line: ${sizeLine}`);
    return size;
}
/**
 * Parse size from traits line (handles formats like "n medium humanoid")
 * Format: "n medium humanoid" or "medium humanoid"
 */
function parseSizeFromTraitsLine(lines) {
    const traitsLine = lines[1];
    if (!traitsLine)
        throw new Error('Could not find traits line (line 2)');
    const words = traitsLine.trim().toLowerCase().split(/\s+/);
    const sizeMap = {
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
function parseSizeFromAlignmentLine(lines) {
    const alignmentLine = lines[1];
    if (!alignmentLine)
        throw new Error('Could not find alignment/size line (line 2)');
    const words = alignmentLine.trim().split(/\s+/);
    const sizeMap = {
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
function parseTraitsPF2e(lines) {
    const traitsLine = lines[1];
    if (!traitsLine)
        throw new Error('Could not find traits line');
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
function parseTraitsFromAlignmentLine(lines) {
    const alignmentLine = lines[1];
    if (!alignmentLine)
        return [];
    const words = alignmentLine.trim().split(/\s+/);
    // Skip first word (alignment like N, LG, CE, etc.)
    // Skip size words (tiny, small, medium, large, huge, gargantuan)
    const sizeWords = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];
    const traits = [];
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
function parsePerceptionPF2e(lines) {
    const perceptionLine = lines.find((line) => line.match(/^Perception\s+/i));
    if (!perceptionLine)
        throw new Error('Could not find perception line');
    const match = perceptionLine.match(/Perception\s+([-+]?\d+)/i);
    if (!match)
        throw new Error('Could not parse perception');
    const value = parseInt(match[1], 10);
    // Try to extract special senses
    const specialMatch = perceptionLine.match(/;\s*(.+)/i);
    const special = specialMatch ? specialMatch[1].trim() : undefined;
    return {
        value,
        proficiency: 'trained',
        special,
    };
}
/**
 * Parse languages
 * Format: "Languages Common, Draconic" or "Languages none"
 */
function parseLanguagesPF2e(lines) {
    const langLine = lines.find((line) => line.match(/^Languages\s+/i));
    if (!langLine)
        return [];
    const langText = langLine.replace(/^Languages\s+/i, '').trim();
    if (langText.toLowerCase() === 'none')
        return [];
    return langText.split(',').map((lang) => lang.trim());
}
/**
 * Parse abilities
 * Format: "Str -4, Dex +2, Con +0, Int -5, Wis +0, Cha +0"
 */
function parseAbilitiesPF2e(lines) {
    const abilityLine = lines.find((line) => line.match(/Str\s+[-+]?\d+/i))?.replace('–', '-');
    if (!abilityLine)
        throw new Error('Could not find abilities line');
    const parseAbility = (abilityName) => {
        const regex = new RegExp(`${abilityName}\\s+([-+]?\\d+)`, 'i');
        const match = abilityLine.match(regex);
        if (!match)
            throw new Error(`Could not parse ${abilityName}`);
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
function parseSkillsPF2e(lines) {
    const skillLine = lines.find((line) => line.match(/^Skills\s+/i));
    if (!skillLine)
        throw new Error('Could not find "Skills" line');
    const skillText = skillLine.replace(/^Skills\s+/i, '').trim();
    const skillPairs = skillText.split(',');
    const skills = [];
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
function parseSkillSingularPF2e(lines) {
    const skillLine = lines.find((line) => line.match(/^Skill\s+/i));
    if (!skillLine)
        throw new Error('Could not find "Skill" line');
    const skillText = skillLine.replace(/^Skill\s+/i, '').trim();
    const skillPairs = skillText.split(',');
    const skills = [];
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
function parseSavesPF2e(lines) {
    const saveLine = lines.find((line) => line.match(/Fort\s+[-+]?\d+/i));
    if (!saveLine)
        throw new Error('Could not find saves line');
    const parseSave = (saveName) => {
        const regex = new RegExp(`${saveName}\\s+([-+]?\\d+)`, 'i');
        const match = saveLine.match(regex);
        if (!match)
            throw new Error(`Could not parse ${saveName}`);
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
function parseACPF2e(lines) {
    const acLine = lines.find((line) => line.match(/^AC\s+\d+/i));
    if (!acLine)
        throw new Error('Could not find AC line');
    const match = acLine.match(/AC\s+(\d+)/i);
    if (!match)
        throw new Error('Could not parse AC');
    return {
        value: parseInt(match[1], 10),
        proficiency: 'trained',
    };
}
/**
 * Parse HP
 * Format: "HP 4; Immunities disease..." or "HP 52 (8d8 + 16)"
 */
function parseHealthPF2e(lines) {
    const hpLine = lines.find((line) => line.match(/^HP\s+\d+/i));
    if (!hpLine)
        throw new Error('Could not find HP line');
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
function parseSpeedsPF2e(lines) {
    const speedLine = lines.find((line) => line.match(/^Speed\s+/i));
    if (!speedLine)
        return { walk: 30 };
    const speedText = speedLine.replace(/^Speed\s+/i, '').trim();
    const speeds = {};
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
function parseSimpleSpeedPF2e(lines) {
    const speedLine = lines.find((line) => line.match(/^Speed\s+/i));
    if (!speedLine)
        throw new Error('Could not find Speed line');
    // Match "Speed 35 feet" or "Speed 35"
    const match = speedLine.match(/Speed\s+(\d+)\s*(?:feet)?/i);
    if (!match)
        throw new Error(`Could not parse speed from line: ${speedLine}`);
    const speedValue = parseInt(match[1], 10);
    return { land: speedValue };
}
/**
 * Parse immunities
 * Format: "HP 4; Immunities disease, mental, non-magical attacks..."
 */
function parseImmunitiesPF2e(lines) {
    const immuneLine = lines.find((line) => line.match(/Immunities\s+/i));
    if (!immuneLine)
        return [];
    const match = immuneLine.match(/Immunities\s+([^;]+)/i);
    if (!match)
        return [];
    return match[1]
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}
/**
 * Parse resistances
 * Format: "Resistances all damage 5 (except force or ghost touch)"
 */
function parseResistancesPF2e(lines) {
    const resistLine = lines.find((line) => line.match(/Resistances\s+/i));
    if (!resistLine)
        return [];
    const match = resistLine.match(/Resistances\s+([^;]+)/i);
    if (!match)
        return [];
    const resistText = match[1].trim();
    const resistances = [];
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
function parseWeaknessesPF2e(lines) {
    const weakLine = lines.find((line) => line.match(/Weaknesses\s+/i));
    if (!weakLine)
        return [];
    const match = weakLine.match(/Weaknesses\s+([^;]+)/i);
    if (!match)
        return [];
    const weakText = match[1].trim();
    const weaknesses = [];
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
function parseStrikesPF2e(lines) {
    const strikes = [];
    for (const line of lines) {
        // Match Melee or Ranged attacks
        const strikeMatch = line.match(/^(Melee|Ranged)\s+\[([^\]]+)\]\s+(.+)/i);
        if (!strikeMatch)
            continue;
        const strikeType = strikeMatch[1]; // Melee or Ranged
        strikeMatch[2]; // one-action, two-actions, etc.
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
        let damage;
        let damageType;
        if (damageMatch) {
            const damageText = damageMatch[1].trim();
            // Parse "1d10+4 piercing plus Grab"
            const damageParts = damageText.match(/^([\dd+\s-]+)\s+(\w+)/);
            if (damageParts) {
                damage = damageParts[1].trim();
                damageType = damageParts[2].trim();
            }
            else {
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
function parseFeaturesPF2e(lines) {
    const features = [];
    // Find where abilities end (last line starting with "Str" or abilities line)
    let abilitiesEndIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/Str\s+[-+]?\d+/i)) {
            abilitiesEndIndex = i;
            break;
        }
    }
    if (abilitiesEndIndex === -1)
        return [];
    // Features can appear:
    // 1. Between abilities and AC (passive features)
    // 2. After HP line (active features, actions)
    let currentFeature = null;
    for (let i = abilitiesEndIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line)
            continue;
        // Skip stat lines (AC, HP, Speed, etc.)
        const isStatLine = line.match(/^(AC|HP|Speed|Fort|Ref|Will|Immunities|Resistances|Weaknesses)\s+/i);
        if (isStatLine)
            continue;
        // Also check for Melee/Ranged (those are strikes, not features)
        const isStrike = line.match(/^(Melee|Ranged)\s+/i);
        if (isStrike)
            continue;
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
                let actionCost;
                if (actionMatch) {
                    const action = actionMatch[1].toLowerCase();
                    if (action.includes('one-action'))
                        actionCost = 1;
                    else if (action.includes('two-action'))
                        actionCost = 2;
                    else if (action.includes('three-action'))
                        actionCost = 3;
                    else if (action.includes('reaction'))
                        actionCost = 'reaction';
                    else if (action.includes('free'))
                        actionCost = 'free';
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
            let name;
            const actionBracketMatch = line.match(/^([^[]+)\s*\[/);
            if (actionBracketMatch) {
                // Has action cost like "Aquatic Ambush [one-action]"
                name = actionBracketMatch[1].trim();
            }
            else {
                // No action cost - name is the first few capitalized words
                // "Deep Breath The crocodile..." -> "Deep Breath"
                // Look for pattern: "Capitalized Words" followed by article/pronoun/lowercase start
                const wordsMatch = line.match(/^([A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*)*)\s+(?:The|the|A|a|An|an|When|when|After|after|If|if|It|it|This|this)/);
                if (wordsMatch) {
                    name = wordsMatch[1].trim();
                }
                else {
                    // Fallback: take words until we hit lowercase or description
                    const words = line.split(/\s+/);
                    let nameWords = [];
                    for (const word of words) {
                        if (/^[A-Z]/.test(word)) {
                            nameWords.push(word);
                        }
                        else {
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
        }
        else if (currentFeature && !isStrike) {
            // Continue current feature (multiline description)
            currentFeature.lines.push(line);
        }
    }
    // Save last feature
    if (currentFeature) {
        const description = currentFeature.lines.join(' ');
        const actionMatch = description.match(/\[([^\]]+)\]/);
        let actionCost;
        if (actionMatch) {
            const action = actionMatch[1].toLowerCase();
            if (action.includes('one-action'))
                actionCost = 1;
            else if (action.includes('two-action'))
                actionCost = 2;
            else if (action.includes('three-action'))
                actionCost = 3;
            else if (action.includes('reaction'))
                actionCost = 'reaction';
            else if (action.includes('free'))
                actionCost = 'free';
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
function parseItemsPF2e(lines) {
    // Items parsing can be added later
    return [];
}

/**
 * Try to parse using a single PF2e parser
 */
function trySinglePF2eActorParse(parser, lines) {
    const errors = [];
    // Helper function to try parsers in sequence with error tracking
    function tryParser(parsers, lines, typeGuard, fieldName, options) {
        for (let i = 0; i < parsers.length; i++) {
            const parserFn = parsers[i];
            try {
                const result = parserFn(lines);
                if (typeGuard(result)) {
                    return result;
                }
            }
            catch (e) {
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
    const isString = (value) => typeof value === 'string';
    const isNumber = (value) => typeof value === 'number' && !isNaN(value);
    const isStringArray = (value) => Array.isArray(value);
    const isPF2eSkillArray = (value) => Array.isArray(value);
    const isPF2eSaves = (value) => typeof value === 'object' && value !== null && 'fortitude' in value;
    const isPF2eSpeeds = (value) => typeof value === 'object' && value !== null;
    const isHealth = (value) => typeof value === 'object' && value !== null && 'value' in value;
    const isPF2ePerception = (value) => typeof value === 'object' && value !== null && 'value' in value;
    const isPF2eResistanceArray = (value) => Array.isArray(value);
    const isPF2eWeaknessArray = (value) => Array.isArray(value);
    const isPF2eFeatureArray = (value) => Array.isArray(value);
    const isPF2eStrikeArray = (value) => Array.isArray(value);
    const isImportItems = (value) => Array.isArray(value);
    const isACType = (value) => typeof value === 'object' && value !== null && 'value' in value;
    const abilities = tryParser(parser.parseAbilities, lines, isPF2eAbilities, 'abilities');
    return {
        name: tryParser(parser.parseName, lines, isString, 'name'),
        level: tryParser(parser.parseLevel, lines, isNumber, 'level'),
        size: tryParser(parser.parseSize, lines, (value) => true, 'size'),
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
function tryPF2eActorParse(parsers, lines) {
    const allErrors = [];
    for (let i = 0; i < parsers.length; i++) {
        const parser = parsers[i];
        try {
            return trySinglePF2eActorParse(parser, lines);
        }
        catch (e) {
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
function textToPF2eActor(input) {
    const lines = input.split('\n');
    const availableParsers = [ParseActorPF2e];
    return tryPF2eActorParse(availableParsers, lines);
}

/**
 * Convert proficiency level to numeric rank
 * @param proficiency - The proficiency level
 * @returns Numeric rank (0-4)
 */
function proficiencyToRank(proficiency) {
    const rankMap = {
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
function convertSizeToPF2e(size) {
    const sizeMap = {
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
const PF2E_SKILL_MAP = {
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

/**
 * Convert PF2e abilities to Foundry format
 */
function convertAbilitiesPF2e(abilities) {
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
function convertSavesPF2e(saves) {
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
function convertSkillsPF2e(skills) {
    const foundrySkills = {};
    for (const skill of skills) {
        const skillName = skill.name.toLowerCase();
        const skillKey = PF2E_SKILL_MAP[skillName];
        if (skillKey) {
            foundrySkills[skillKey] = {
                rank: proficiencyToRank(skill.proficiency),
            };
        }
        else {
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
function convertPerceptionPF2e(perception) {
    return {
        value: perception.value,
        rank: proficiencyToRank(perception.proficiency),
    };
}
/**
 * Convert speeds to Foundry format
 */
function convertSpeedsPF2e(speeds) {
    const walkSpeed = speeds.walk || 30;
    const otherSpeeds = [];
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
function convertAttributesPF2e(actor) {
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
function convertDetailsPF2e(actor) {
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
function convertTraitsPF2e(actor) {
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
function convertImmunitiesPF2e(immunities) {
    return immunities.map((immunity) => ({
        type: immunity,
    }));
}
/**
 * Convert resistances to Foundry format
 */
function convertResistancesPF2e(resistances) {
    return resistances.map((resistance) => ({
        type: resistance.type,
        value: resistance.value || 0,
        exceptions: resistance.exceptions ? [resistance.exceptions] : undefined,
    }));
}
/**
 * Convert weaknesses to Foundry format
 */
function convertWeaknessesPF2e(weaknesses) {
    return weaknesses.map((weakness) => ({
        type: weakness.type,
        value: weakness.value,
    }));
}
/**
 * Main conversion function from ImportPF2eActor to Foundry PF2e format
 */
function actorToPF2e(actor) {
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

let dndPacks = null;
let otherPacks = null;
const getItemFromPackAsync = async (pack, itemName) => {
    let result = null;
    const lowerName = itemName.toLowerCase();
    const item = pack.index.find((e) => lowerName === e?.name?.toLowerCase());
    if (item) {
        const itemDoc = await pack.getDocument(item._id);
        result = itemDoc?.toObject();
    }
    return result;
};
const getItemImageFromPacksAsync = async (itemName, itemType) => {
    const item = await getItemFromPacksAsync(itemName, itemType);
    return item?.img;
};
const getItemFromPacksAsync = async (itemName, type) => {
    let result = null;
    // Create pack arrays once to save time.
    if (dndPacks == null && otherPacks == null) {
        // Look through the non-default packs first, since those are more
        // likely to contain customized versions of the dnd5e items.
        dndPacks = [];
        otherPacks = [];
        for (const pack of game.packs) {
            if (pack.metadata.id.startsWith('dnd5e')) {
                dndPacks.push(pack);
            }
            else {
                otherPacks.push(pack);
            }
        }
    }
    if (otherPacks != null) {
        for (const pack of otherPacks) {
            result = await getItemFromPackAsync(pack, itemName);
            if (result && (!type || result.type === type)) {
                break;
            }
        }
    }
    if (result == null && dndPacks != null) {
        for (const pack of dndPacks) {
            result = await getItemFromPackAsync(pack, itemName);
            if (result && (!type || result.type === type)) {
                break;
            }
        }
    }
    return result;
};

const spellUsesToUses = (uses) => {
    const { value, per } = uses;
    const newUses = {
        value,
        max: value?.toString(),
        per,
    };
    return newUses;
};
async function spellToFifth(passedSpell) {
    const spell = { ...passedSpell };
    let item = await getItemFromPacksAsync(spell.name, 'spell');
    if (!item)
        return;
    let mode = undefined;
    if (spell.uses.atWill) {
        mode = 'innate';
    }
    item = {
        ...item,
        system: {
            ...item.system,
            preparation: {
                ...item?.system?.preparation,
                mode,
            },
            uses: spellUsesToUses(spell.uses),
        },
    };
    const fifthItem = {
        name: item.name,
        type: item.type,
        img: item.img,
        data: {
            ...item.system,
        },
    };
    return fifthItem;
}
async function itemToFifth(item) {
    const img = await getItemImageFromPacksAsync(item.name, item.type);
    const { name, save, uses, type, description, activation, damage, actionType, range, ability, attackBonus } = item;
    const fifthUses = uses ? spellUsesToUses(uses) : undefined;
    return {
        name,
        type,
        img,
        data: {
            description: {
                value: description,
            },
            activation,
            damage,
            actionType,
            range,
            ability,
            save,
            uses: fifthUses,
            attackBonus: attackBonus?.toString(),
        },
    };
}

/**
 * Route for D&D 5e text import (existing functionality)
 */
async function txtRoute5e(stringData) {
    const actor = textToActor(stringData);
    const { items } = actor;
    const preparedItems = await Promise.all(items.map((item) => {
        return itemToFifth(item);
    }));
    let reducedSpells = [];
    if (actor?.spells) {
        const addedSpells = await Promise.all(actor?.spells?.map((spell) => {
            return spellToFifth(spell);
        }));
        reducedSpells = addedSpells.reduce((acc, cur) => {
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
    if (!foundryActor)
        return;
    await Promise.all(preparedItems.map(async (item) => {
        const foundryItem = new Item(item);
        await foundryActor.createEmbeddedDocuments('Item', [foundryItem.toObject()]);
    }));
}
/**
 * Route for Pathfinder 2e text import (new functionality)
 */
async function txtRoutePF2e(stringData) {
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
    }
    catch (error) {
        console.error('=== PF2e Import Error ===');
        console.error('Error details:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            ui.notifications?.error(`PF2e Import Error: ${error.message}`);
        }
        else {
            ui.notifications?.error('PF2e Import Error: Unknown error occurred');
        }
        throw error;
    }
}
/**
 * Main route handler - detects game system and routes appropriately
 */
async function txtRoute(stringData) {
    const gameSystem = game?.system?.id;
    if (gameSystem === 'pf2e') {
        console.log('Processing as Pathfinder 2e actor');
        await txtRoutePF2e(stringData);
    }
    else {
        // Default to D&D 5e for backward compatibility
        console.log('Processing as D&D 5e actor');
        await txtRoute5e(stringData);
    }
}
async function processActorInput({ jsonfile, clipboardInput }) {
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

// type guard game
const isGame = (game) => {
    return game !== {} && game !== null && game !== undefined;
};

const supportsJournalPages = () => {
    if (isGame(game)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const release = game.release;
        return release.generation >= 10;
    }
    return false;
};

async function buildTextBlock(input, api, opts) {
    await api.foundryJournalEntry.create({
        name: input?.name ?? 'Unknown Name',
        content: input.content,
        folder: opts?.folder,
        sort: input.sortValue,
    });
}

function getRootName(jsonfile) {
    // get file name from full path
    const fileName = jsonfile.split('/').pop() || jsonfile;
    // remove extension
    const name = fileName.split('.').shift() || fileName;
    // convert _ to space
    const rootName = name.replace(/_/g, ' ');
    // Capitalize first letter
    return rootName.charAt(0).toUpperCase() + rootName.slice(1);
}
const formatList = (note) => {
    let prepend = '';
    if (note.includes('1. ') && note.includes('2. ')) {
        const splitNote = note.split(/[0-9]+\./);
        if (note[0] !== '1') {
            prepend = splitNote[0];
            splitNote.shift();
        }
        let asList = splitNote.map((listItem) => {
            return `<li>${listItem.replace('\n', '').trim()}</li>`;
        });
        asList = asList.filter((item) => item !== '<li></li>');
        return `${prepend}<ol>${asList.join('')}</ol>`;
    }
    return `${note}`;
};
function normalizeHeaders(note) {
    if (note.tag.includes('h')) {
        if (Number(note.tag.replace('h', '')) > 10) {
            note.tag = 'p';
        }
    }
    const tag = note.tag.includes('h') ? 'h2' : note.tag;
    return `<${tag}>${note.value}</${tag}>`;
}
const noteMaps = (note) => {
    return formatList(note);
};
const mergeParagraphs = (noteList, current) => {
    if (current.tag !== 'p') {
        noteList.push(current);
        return noteList;
    }
    if (noteList.length === 0) {
        noteList.push(current);
        return noteList;
    }
    if (noteList[noteList.length - 1].tag === 'p') {
        noteList[noteList.length - 1].value += `\n${current.value}`;
    }
    else {
        noteList.push(current);
    }
    return noteList;
};
const collission_tracker = {};
async function createFoldersRecursive({ node, rootFolder, currentFolder, currentDepth = 1, settings }, api) {
    const { foundryFolder, foundryJournalEntry } = api;
    let folder = currentFolder ?? rootFolder;
    // if node.value in collission_tracker, then we have a collision
    collission_tracker[node.value] = collission_tracker[node.value] ?? 0;
    collission_tracker[node.value]++;
    const name = `${node.value}`;
    if (node.children.length > 0 && currentDepth < settings.folderDepth) {
        const current_id = currentFolder?.data?._id ?? rootFolder.data._id;
        folder =
            (await foundryFolder.create({
                name: cleanName$1(name),
                type: 'JournalEntry',
                parent: current_id,
                sorting: 'm',
            })) ?? rootFolder;
        currentDepth++;
    }
    const notes = node.notes.reverse();
    const reduced = notes.reduce(mergeParagraphs, []);
    const values = reduced.map(normalizeHeaders);
    const finalNotes = values.map(noteMaps).reverse();
    let htmlNote = finalNotes.reduce((note, htmlNote) => {
        return `${htmlNote}${note}`;
    }, ``);
    htmlNote = `<div>${htmlNote}</div>`;
    await foundryJournalEntry.create({
        name: `${cleanName$1(name)}`,
        content: htmlNote,
        collectionName: node.value,
        folder: folder?.data?._id,
        sort: node.sortValue ?? 0,
    });
    function getSortValue(title) {
        // if first two characters are a number, extract the number
        const firstTwo = title.substring(0, 2);
        if (firstTwo.match(/^\d+$/)) {
            return parseInt(firstTwo, 10);
        }
        // if the first character is a number, extract the number
        const first = title.substring(0, 1);
        if (first.match(/^\d+$/)) {
            return parseInt(first, 10);
        }
        // otherwise, return the ascii value of the first characters
        return first.charCodeAt(0);
    }
    if (node.children) {
        const children = node.children.map((child) => {
            return { ...child, sortValue: getSortValue(child.value) };
        });
        for (const child of children) {
            await createFoldersRecursive({ node: child, rootFolder, currentFolder: folder, currentDepth, settings }, api);
        }
    }
}
async function journalFromJson(name, data) {
    const folder = await Folder.create({
        name: cleanName$1(name),
        type: 'JournalEntry',
        sorting: 'm',
    });
    if (!folder) {
        console.log(`Error creating folder ${name}`);
        return;
    }
    else {
        const settings = Config._load();
        console.log(`Building journals with a depth of ${settings.folderDepth}`);
        data.forEach(async (section) => {
            await createFoldersRecursive({ node: section, rootFolder: folder, currentDepth: 1, settings }, {
                foundryFolder: Folder,
                foundryJournalEntry: JournalEntry,
            });
        });
        console.log(`Finished generating ${name} Journals...`);
    }
}

function newLineToHTML(content) {
    return content.replace(/\n/g, '<br>');
}
function symbolToList(content, symbol) {
    let lines = content.split('\n');
    let firstBulletLine = -1;
    let lastBulletLine = -1;
    lines = lines.map((line, index) => {
        if (line.includes(symbol) && firstBulletLine === -1) {
            firstBulletLine = index;
        }
        if (line.includes(symbol)) {
            lastBulletLine = index;
            line = line.replace(symbol, '');
            return `<li>${line}</li>`;
        }
        else {
            return line;
        }
    });
    if (firstBulletLine !== -1 && lastBulletLine !== -1) {
        lines[firstBulletLine] = `<ul>${lines[firstBulletLine]}`;
        lines[lastBulletLine] = `${lines[lastBulletLine]}</ul>`;
        const beforeList = lines.slice(0, firstBulletLine).join('\n');
        const list = lines.slice(firstBulletLine, lastBulletLine + 1).join('');
        const afterList = lines.slice(lastBulletLine + 1).join('\n');
        return `${beforeList}\n${list}\n${afterList}`;
    }
    return content;
}
function bulletToList(content) {
    return symbolToList(content, '•');
}
function dashToList(content) {
    return symbolToList(content, '-');
}
function allCapWordsToBold(content) {
    return content.replace(/\b[A-Z]{2,}\b/g, (match) => `<b>${match}</b>`);
}
function startsWithName(line) {
    const re = /\b[A-Z]{1}[a-z]{1,}\b\./g;
    const matches = line.match(re);
    if (matches === null) {
        return false;
    }
    const start = line.split('.')[0];
    if (start.split(' ').length > 3) {
        return false;
    }
    return true;
}
function namesToBold(content) {
    let split = content.split('\n');
    split = split.filter((line) => line !== '');
    split = split.map((line) => {
        if (startsWithName(line)) {
            const name = line.split('.')[0];
            const bold = `<b>${name}</b>`;
            line = line.replace(name, bold);
        }
        return line;
    });
    return split.join('\n');
}
function formatContent(content) {
    const formatters = [formatList, allCapWordsToBold, namesToBold, bulletToList, dashToList, newLineToHTML];
    return formatters.reduce((acc, current) => {
        acc = current(acc);
        return acc;
    }, content);
}
function parseTextBlock(input) {
    const name = input.split('\n')[0];
    const content = input.split('\n').slice(1).join('\n');
    return { name, content: formatContent(content) };
}

function isTitle(line) {
    const shortEnough = line.split(' ').length < 7;
    const endsWithColon = line.endsWith(':');
    // first character and last character are parens
    const hasParens = line.trim().startsWith('(') && line.trim().endsWith(')');
    return (shortEnough &&
        !line.includes('•') &&
        line.length > 0 &&
        !endsWithColon &&
        !hasParens &&
        !line.endsWith(',') &&
        !line.startsWith('-') &&
        !line.endsWith('-') &&
        !line.startsWith('–') &&
        !line.endsWith('–'));
}
const parseMultipleTextBlocks = (input) => {
    const lines = input.split('\n');
    let entries = [];
    lines.forEach((line) => {
        if (isTitle(line)) {
            const name = line.trim();
            entries.push({ name, content: '' });
        }
        else {
            if (entries[entries.length - 1] === undefined) {
                const name = line.trim();
                entries.push({ name, content: '' });
            }
            entries[entries.length - 1].content += `\n${line}`;
        }
    });
    entries = entries.filter(({ name, content }) => name !== '' && content !== '');
    let index = 0;
    return {
        entries: entries.map((entry) => {
            return {
                name: entry.name,
                content: formatContent(entry.content),
                sortValue: index++,
            };
        }),
    };
};
const parseMultipleTextPages = (input) => {
    const lines = input.split('\n');
    let entries = [];
    lines.forEach((line) => {
        if (isTitle(line)) {
            const name = line.trim();
            entries.push({ name, content: '' });
        }
        else {
            if (entries[entries.length - 1] === undefined) {
                const name = line.trim();
                entries.push({ name, content: '' });
            }
            entries[entries.length - 1].content += `\n${line}`;
        }
    });
    entries = entries.filter(({ name, content }) => name !== '' && content !== '');
    let index = 0;
    return {
        pages: entries.map((entry) => {
            return {
                title: { show: true },
                name: entry.name,
                type: 'text',
                text: {
                    content: formatContent(entry.content),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML,
                },
                sortValue: index++,
            };
        }),
    };
};
const parseHTMLIntoMultiplePages = (input, constants = CONST) => {
    const sections = input.split(/(?=<h1>)/);
    const pages = sections.map((section) => {
        const h1Regex = /<h1>(.*?)<\/h1>/g;
        const title = h1Regex.exec(section)?.[1] ?? 'Parsed Page';
        const content = section.replace(h1Regex, '').trim();
        if (title && content) {
            return {
                title: { show: true },
                name: title,
                type: 'text',
                text: {
                    content,
                    format: constants.JOURNAL_ENTRY_PAGE_FORMATS.HTML,
                },
            };
        }
        return undefined;
    });
    const filteredPages = pages.filter((page) => page !== undefined);
    return { pages: filteredPages };
};

function isHTML(str) {
    const a = document.createElement('div');
    a.innerHTML = str;
    for (let c = a.childNodes, i = c.length; i--;) {
        if (c[i].nodeType == 1)
            return true;
    }
    return false;
}
async function multipleRoutePages(input) {
    const data = isHTML(input) ? parseHTMLIntoMultiplePages(input) : parseMultipleTextPages(input);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    JournalEntry.implementation.create({
        pages: data.pages,
        name: 'Parsed Journal Entries',
    });
}
async function multipleRoute(input) {
    const folder = await Folder.create({
        name: 'Parsed Journal Entries',
        type: 'JournalEntry',
        sorting: 'm',
    });
    const blocks = parseMultipleTextBlocks(input);
    await Promise.all(blocks.entries.map(async (block) => {
        return await buildTextBlock(block, {
            foundryFolder: Folder,
            foundryJournalEntry: JournalEntry,
        }, { folder: folder?.data?._id });
    }));
}
async function processInputJSON({ jsonfile, clipboardInput, buildMultiple }) {
    if (clipboardInput) {
        if (buildMultiple) {
            if (supportsJournalPages()) {
                return await multipleRoutePages(clipboardInput);
            }
            else {
                // TODO: remove this once we have deprecated v9 support
                return await multipleRoute(clipboardInput);
            }
        }
        const input = parseTextBlock(clipboardInput);
        await buildTextBlock(input, {
            foundryFolder: Folder,
            foundryJournalEntry: JournalEntry,
        }, {});
        return;
    }
    const response = await fetch(jsonfile);
    if (!response.ok) {
        console.log(`Error reading ${jsonfile}`);
        return;
    }
    const data = await response.text();
    const json = JSON.parse(data);
    const name = getRootName(jsonfile);
    journalFromJson(name, json);
}

// Hook for each specific directory tab render event
Hooks.on('renderJournalDirectory', (app, html) => {
    if (!game?.user?.isGM)
        return;
    const config = Config._load();
    if (config.journalImporter) {
        renderSidebarButtons(app, 'journal', processInputJSON);
    }
});
Hooks.on('renderRollTableDirectory', (app, html) => {
    if (!game?.user?.isGM)
        return;
    const config = Config._load();
    if (config.tableImporter) {
        renderSidebarButtons(app, 'tables', processTableJSON);
    }
});
Hooks.on('renderActorDirectory', (app, html) => {
    if (!game?.user?.isGM)
        return;
    const config = Config._load();
    if (config.actorImporter) {
        renderSidebarButtons(app, 'actors', processActorInput);
    }
});
Hooks.on('renderItemDirectory', (app, html) => {
    if (!game?.user?.isGM)
        return;
    const config = Config._load();
    if (config.itemImporter) {
        renderSidebarButtons(app, 'items', processItemInput);
    }
});
// Initialize module
Hooks.once('init', async () => {
    console.log(`${CONSTANTS.module.name} | Initializing ${CONSTANTS.module.title}`);
    // Assign custom classes and constants here
    // Register custom module settings
    registerSettings();
    // Preload Handlebars templates
    await preloadTemplates();
    // Register custom sheets (if any)
});
// When ready
Hooks.once('ready', async () => {
    // Do anything once the module is ready
});
//# sourceMappingURL=foundryvtt-importer.js.map
