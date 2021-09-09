import { Command } from 'commander';
import * as fs from 'fs/promises';
import { GeneratingConfiguration, PackageJson } from './types';
import { createConfigurationObject } from './vscode-extension-config';

class InvalidProperty extends Error {
  constructor(properyName?: string, message?: string) {
    super(message || `property ${properyName} is invalid or not defined`);
  }
}

async function run(inputFile: string): Promise<void> {
  console.log(`reading input from "${inputFile}"`);
  const {
    configurations,
    prefix,
    targetFile = 'package.json',
    tsconfig = undefined,
    tags,
    sort = true,
  }: GeneratingConfiguration = JSON.parse(await fs.readFile(inputFile, 'utf8'));

  if (configurations === undefined || typeof configurations !== 'object') {
    throw new InvalidProperty('configurations');
  }
  if (prefix === undefined || typeof prefix !== 'string') {
    throw new InvalidProperty('prefix');
  }

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
  // make sure contibutes.configuration is defined
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

  console.log(`writing updated json to "${targetFile}"`);
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
