import { Command } from 'commander';
import * as fs from 'fs/promises';
import { GeneratingConfiguration, PackageJson } from './types';
import {
  InvalidConfigurationError,
  readGeneratingConfiguration,
  validateInputConfig,
} from './input-configuration-helper';
import { createConfigurationObject } from './vscode-extension-config';
import JSON5 from 'json5';

async function run(inputFile: string): Promise<void> {
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

const program = new Command();

program.option(
  '-f, --file <file>',
  'input file configuring the update',
  'vscode-ext-config.json'
);

program.parse(process.argv);

const options = program.opts();
run(options.file);
