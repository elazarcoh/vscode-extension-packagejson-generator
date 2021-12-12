# VSCode-extensions package.json generator

## Usage

### In code

Define `Config` interface, and add documentation with annotations for additional data for the configuration

```ts
export interface Config {
  /**
   * @default true
   * @description description of boolConfig
   */
  boolConfig: boolean;

  /**
   * @enumDescriptions [
        "Foo description"
        "Bar description"]
   * @default "Bar"
   * @description enumConfig description
   */
  enumConfig: 'Foo' | 'Bar';
}
```

### As cli tool

```bash
update-package-json ts2pjs 'vscode-extension-config.json'
```

The input JSON file may look like this:

```json
{
  "prefix": "myExt",
  "configurations": [
    {
      "filePath": "./src/config.ts",
      "name": "Config"
    }
  ],
  "targetFile": "package.json",
  "tsconfig": "tsconfig.json"
}
```

### As a Webpack plugin

```js
const {
  VSCodeExtensionsPackageJsonGenerator,
} = require('vscode-extensions-json-generator/webpack');

{
  // ...
  plugins: [
    new VSCodeExtensionsPackageJsonGenerator('vscode-extension-config.json'),
  ];
}
```

or with object as the config

```js
{
  // ...
  plugins: [
    new VSCodeExtensionsPackageJsonGenerator({
      prefix: 'myExt',
      configurations: [
        {
          filePath: './src/config.ts',
          name: 'Config',
        },
      ],
      targetFile: 'package.json',
      tsconfig: 'tsconfig.json',
    }),
  ];
}
```

### Bonus - accessing configuration from code utility

```ts
import { configUtils } from 'vscode-extensions-json-generator/utils';

export const getConfiguration =
  configUtils.ConfigurationGetter<Config>('myExt');

// use it to get configuration with auto-complete and automatically type inference
const e = getConfiguration('enumConfig');
```

or as a class
```ts
import { configUtils } from 'vscode-extensions-json-generator/utils';

export const configurations = new configUtils.VSCodeConfigurations<Config>('myExt');

// get
const e = configurations.get('enumConfig');

// update
configurations.update('enumConfig', 'Foo');
```

## Config options

```jsonc
{
  "configurations": [
    {
      "filePath": "./src/config1.json",
      "name": "Config1"
    },
    {
      "filePath": "./src/config2.json",
      "name": "Config2"
    }
    // ...
  ],
  "prefix": "myExt",
  // tags that aren't being used in json schema by default.
  "tags": [
    "markdownDescription",
    "scope",
    "patternErrorMessage",
    "deprecationMessage",
    "enumDescriptions",
    "deprecated"
    // ...
  ],
  "targetFile": "package.json",
  "tsconfig": "tsconfig.ts",
  "sort": true
}
```

## Convert from existing `package.json` to TypeScript interface

Use the cli tool with `pjs2ts`.

```bash
update-package-json pjs2ts 'package.json' -p conf --add-config-class
```

Options:

```bash
Convert the package.json `contributes.configurations` to a TypeScript file     

Arguments:
  inputFile                   input package.json file (default: "package.json")

Options:
  -p, --prefix [prefix]       prefix for the configuration
  -o, --output [outputFile]   output file (default: "config.ts")
  --add-config-class
  --config-class-name [name]  name of the configuration class (default: "Configuration")
  -h, --help                  display help for command
```
