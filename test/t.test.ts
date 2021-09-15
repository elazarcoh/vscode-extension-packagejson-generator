import betterAjvErrors from '@stoplight/better-ajv-errors';
import { runTests } from '@vscode/test-electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import Ajv from 'ajv';
import assert from 'assert';
import { createVSIX } from 'vsce';
import type { JSONSchema7 } from 'json-schema';
import type { GeneratingConfiguration, PackageJson } from '../src/types';
import { createConfigurationObject } from '../src/vscode-extension-config';
import { DEFAULT_TAGS } from '../src/defaults';

let extensionsSchema: JSONSchema7;
before(async function () {
  this.timeout(10000);
  const schemaFile = `./test/schemas/vscode-extensions.schema.json`;
  const schema: JSONSchema7 = JSON.parse(await fs.readFile(schemaFile, 'utf8'));
  extensionsSchema = schema;
});

async function updatePackageJson(definitions: GeneratingConfiguration) {
  const { configurations, prefix, targetFile, tsconfig, tags, sort } =
    definitions;

  const nextConfig = createConfigurationObject(
    prefix,
    configurations,
    tsconfig,
    tags,
    sort
  );

  const packageJson: PackageJson = JSON.parse(
    await fs.readFile(targetFile!, 'utf8')
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

  return packageJson;
}

function validator() {
  const ajv = new Ajv({ strict: true, allowUnionTypes: true });
  ajv.addKeyword('defaultSnippets');
  ajv.addKeyword('deprecationMessage');
  ajv.addKeyword('errorMessage');
  ajv.addKeyword('markdownDescription');
  ajv.addKeyword('patternErrorMessage');
  ajv.addKeyword('enumDescriptions');
  ajv.addKeyword('markdownDeprecationMessage');
  ajv.addKeyword('markdownEnumDescriptions');

  const validate = ajv.compile(extensionsSchema);
  return validate;
}

async function exists(path: string): Promise<boolean> {
  return fs
    .access(path)
    .then((_) => true)
    .catch((_) => false);
}

describe('vscode-extension', () => {
  const extensionPath =
    'D:/elazar/private/vscode-extension-config/test/extension-example-configuration/';
  const relativePath = (path: string) => `${extensionPath}/${path}`;

  const packageJsonResultPath = relativePath('package.json');
  const vsixResultPath = relativePath('configuration-sample-0.0.1.vsix');

  let packageJson: PackageJson;

  before('vscode-extension', async function () {
    this.timeout(10000);
    packageJson = await updatePackageJson({
      configurations: [
        {
          filePath: relativePath('src/config.ts'),
          name: 'Config',
        },
      ],
      prefix: 'conf',
      targetFile: relativePath('package.no-config.json'),
      tsconfig: relativePath('tsconfig.json'),
      tags: DEFAULT_TAGS,
    });
  });

  after('vscode-extension', async function () {
    this.timeout(10000);
    if (await exists(vsixResultPath)) fs.unlink(vsixResultPath);
    if (await exists(packageJsonResultPath)) fs.unlink(packageJsonResultPath);
  });

  step('should be a valid package.json for extensions', async () => {
    const validate = validator();
    const valid = validate(packageJson);
    const errors = betterAjvErrors(extensionsSchema, validate.errors, {
      propertyPath: [],
      targetValue: packageJson,
    });
    assert(valid, errors.map((e) => e.error).join('\n'));
  }).timeout(10000);

  xstep('should be able to compile', async () => {
    console.info(`writing updated json to "${packageJsonResultPath}"`);
    await fs.writeFile(
      packageJsonResultPath,
      JSON.stringify(packageJson, undefined, 2).concat('\n')
    );
    await createVSIX({
      cwd: relativePath('.'),
    });
    const vsixExists = await exists(vsixResultPath);
    assert(vsixExists, 'extension build error');
  }).timeout(100000);

  step('extension tests should pass', async () => {
    try {
      const extensionDevelopmentPath = path.resolve(relativePath('.'));

      const extensionTestsPath = path.resolve(
        relativePath('test/suite/index'),
        './suite/index'
      );

      await runTests({
        extensionDevelopmentPath,
        extensionTestsPath,
        launchArgs: ['--disable-extensions'],
      });
    } catch (err) {
      assert.fail('Failed to run tests');
    }
  }).timeout(5 * 60 * 1000); // it might download vscode, so it can take time.
});