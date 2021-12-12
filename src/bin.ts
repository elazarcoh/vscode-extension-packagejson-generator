import { Command } from 'commander';
import * as fs from 'fs/promises';
import { PackageJson } from './types';
import {
  InvalidConfigurationError,
  readGeneratingConfiguration,
} from './input-configuration-helper';
import { DEFAULT_TAGS } from "./defaults";
import { createConfigurationObject } from './vscode-extension-config';
import { compile } from 'json-schema-to-typescript'

async function ts2pjs(inputFile: string): Promise<void> {
  console.info(`reading input from "${inputFile}"`);
  let config;
  try {
    config = await readGeneratingConfiguration(inputFile);
  } catch (err) {
    if (err instanceof InvalidConfigurationError) {
      console.error(err.validationErrors);
    } else {
      console.error(err);
    }
    return;
  }

  const {
    configurations,
    prefix,
    templateFile,
    targetFile,
    tsconfig,
    tags,
    sort,
  } = config;

  const nextConfig = createConfigurationObject(
    prefix,
    configurations,
    tsconfig,
    tags,
    sort
  );

  const packageJson: PackageJson = JSON.parse(
    await fs.readFile(templateFile, 'utf8')
  );
  // make sure contributes.configuration is defined
  if (packageJson.contributes?.configuration === undefined) {
    if (packageJson.contributes === undefined)
      packageJson.contributes = { configuration: {} };
    else {
      packageJson.contributes.configuration = {};
    }
  }
  for (const [key, value] of Object.entries(nextConfig)) {
    packageJson.contributes.configuration[key] = value;
  }

  console.info(`writing updated json to "${targetFile}"`);
  await fs.writeFile(
    targetFile,
    JSON.stringify(packageJson, undefined, 2).concat('\n')
  );
}

async function pjsToTs(
  inputFile: string,
  {
    prefix, output, addConfigClass, configClassName,
  }: {
    prefix?: string, output: string, addConfigClass?: boolean, configClassName: string
  } = { output: 'config.ts', configClassName: 'Configuration' }
): Promise<void> {
  const packageJson: PackageJson = JSON.parse(
    await fs.readFile(inputFile, 'utf8')
  );
  const schema = packageJson.contributes.configuration

  if (prefix) {
    const regexp = new RegExp(`^${prefix}\.`);
    const removePrefix = (key: string) => key.replace(regexp, '');
    schema.properties = Object.fromEntries(Object.entries(schema.properties).map(([key, value]) => ([removePrefix(key), value])))
  }
  let ts = await compile(schema, configClassName, { jsdocTags: DEFAULT_TAGS, bannerComment: "" });
  if (prefix && addConfigClass) {
    ts =
      `import { configUtils } from "vscode-extensions-json-generator/utils";\n\n` +
      ts + `\n` +
      `export const configurations = new configUtils.VSCodeConfigurations<${configClassName}>('${prefix}');\n`
  }
  await fs.writeFile(output, ts);
}


const program = new Command();

program.command('ts2pjs')
  .description('convert a typescript configuration to a package.json configuration')
  .argument('[inputFile]', 'input file configuring the update', 'vscode-ext-config.json')
  .action(ts2pjs);

program.command('pjs2ts')
  .description("Convert the package.json `contributes.configurations` to a TypeScript file")
  .argument('[inputFile]', 'input package.json file', 'package.json')
  .option('-p, --prefix [prefix]', 'prefix for the configuration')
  .option('-o, --output [outputFile]', 'output file', 'config.ts')
  .option('--add-config-class')
  .option('--config-class-name [name]', 'name of the configuration class', 'Configuration')
  .action(pjsToTs);

program.parse(process.argv);
