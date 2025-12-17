# Development Guide

## Contributing to the codebase

Currently the actor API is flushed out and extensible for contributions. The
Item parsers are starting to be flushed out.

### Dev Environment

#### Dev Foundry Configuration

I recommend setting up a foundry dev environment. This should entail copying
your FoundryVTT folder and making a new folder, say `DevFoundryVTT`. Then modify
the `dataPath` located in the file `FoundryVTT/Config/options.json` to reflect
the new base folder `DevFoundryVTT`. Now when you launch Foundry, you should
have an environment free from your standard game sessions. I recommend removing
any extra modules and setting up a clean 'hello world' to test in.

#### Installing this module

Clone the repository to your system, and ensure you have NPM and Node installed
and up to date.

To install the dependencies, run the following from the project directory:

```sh
npm i
```

Ensure everything installed and the tests are passing, run:

```sh
npm run test
```

Ensure you can build the project into a distributable package for Foundry:

```sh
npm run build
```

##### For Linux/Mac Development

The build command generates build artifacts in the root project directory (`module/`, `styles/`, `templates/`, `lang/`). For production builds, use `npm run build:prod` which outputs to `dist/`.

You can now symlink this module into your DevFoundry addon repo with the
following command. Run the command from the modules directory of your dev
foundry installation:

```sh
ln -s <PROJECT-DIR> foundryvtt-importer
```

For example, the command on my system looks like so:

```sh
ln -s ~/codespace/foundryvtt-importer foundryvtt-importer
```

You should now be able to view, enable, and use the module from within Foundry.

##### For Windows Development

Since Windows does not support symlinks in the same way, clone the repository directly into your Foundry modules directory (e.g., `FoundryVTT/Data/modules/foundryvtt-importer`). The build artifacts (`module/`, `styles/`, `templates/`, `lang/`) will be placed in the root of the cloned repository, which is now inside the modules folder. Foundry will detect and load the module directly.

For production builds, use `npm run build:prod` which outputs to `dist/`.

### Testing Components

Most logic that doesn't directly interface with Foundry is easily testible, and
tests should be written for all additional logic.

If you add a function, there should be a test that corresponds.

Tests are located in the `test` directory, place your tests corresponding to
the structure for a file you are adding, for example a new parser for bulk markdowns
should have tests located at `test/actor/parsers/markDownBulk.test.ts`

To get test input, you can paste your data into the input box for the tool on
foundry, open up the 'developer tools', and then copy the data that is logged
in the console. This test data can be directly pasted as a string and used to
validate any logic that is added.

### Actor Parser Structure

The actor parsers are populated in the `src/module/actor/parsers/available.ts`
list. Each element of an actor will have a list of availble parsers to attempt
to parse that elment.

Each parser is well typed and must either return the particular element, or
throw an error. When the module recieves input, it will hand that input to each
parser in the list for each field in the actor.

This system means that an actor can be built from many different forms of
input, and that input doesn't need to be routed to any specific parser. If a
parser cannot handle the input it will error, and the next parser will be run.


---

**NOTE**

Feats, actions, weapons, etc, are all represented as Items in Foundry. I'm
slowly flushing out the item parser, but currently the actor parser
itemsParsers expects a return of one of the types defined in the Item
interface. Look at the implementation of parseItemsWTC for an example of item
parsing.

---

### Adding a parser

The current parsers are wtcTextBlock parsers, which attempt to convert blocks
of text that resemble a Wizards of the Coast Monster Block into the discrete
actor elements.

To add a parser, create a file in `src/module/actor/parsers/yourNewParser.ts`
and a corresponding test file `test/actor/parsers/yourNewParser.test.ts`

Now you can define a parser, such as for parsing a name. You can find the list
of potential parsers and their expected types in the file `src/module/actor/parserTypes.ts`


Now you can create your new parser for a name:

```ts
export const nameParserHelloWorld: NameParser = (lines) => {
  if (lines[0] === 'Hello') return 'Hello, World!'
  throw new Error('Have not implemented parser yet!');
};
```

and add it to the list of availble name parsers parsers in `src/module/actor/parsers/available.ts`

and you can create your new test for your parser in `test/actor/parsers/yourNewParser.test.ts`

```ts
describe('nameParserHelloWorld', () => {
  it('should return hello world', () => {
    const testInput = ['Hello']
    expect(nameParserHelloWorld(testInput)).toEqual('Hello, World!')
  });
  it('should throw an error with invalid input', () => {
    const invalidInput = ['invalid']
    expect(() => nameParserHelloWorld(invalidInput)).toThrow();
  })
})
```

If you want to test all of the parsers  working together, or pass an entire
stat block to all parsers, you can import and pass your test to `textToActor`,
which is the top level function that is called when input is recieved by the
module.