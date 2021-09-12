import { Command } from 'commander';
import * as fs from 'fs/promises';
import { PackageJson } from './types';
import { validateInputConfig } from './validate-input-configuration';
import { createConfigurationObject } from './vscode-extension-config';
import JSON5 from 'json5';

async function run(inputFile: string): Promise<void> {
  console.info(`reading input from "${inputFile}"`);
  const config = JSON5.parse(await fs.readFile(inputFile, 'utf8'));
  const validOrError = validateInputConfig(config);
  if (validOrError !== true) {
    console.error(validOrError);
    return;
  }
  const {
    configurations,
    prefix,
    targetFile = 'package.json',
    tsconfig = undefined,
    tags,
    sort = true,
  } = config;

  const nextConfig = createConfigurationObject(
    prefix,
    configurations,
    tsconfig,
    tags,
    sort
  );

  const packageJson: PackageJson = JSON.parse(
    await fs.readFile(targetFile, 'utf8')
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
