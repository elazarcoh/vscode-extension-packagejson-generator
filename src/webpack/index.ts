import { Compilation, Compiler } from 'webpack';
import {
  createConfigurationObject,
  validateInputConfig,
} from '../vscode-extension-config';
import * as fs from 'fs/promises';
import { GeneratingConfiguration, PackageJson } from '../types';
import { defaultConfig } from '../defaults';

// for some reason I can't import it from webpack
type WebpackLogger = ReturnType<Compilation['getLogger']>;

const PLUGIN = 'VSCode Extension Config Generator';

class InvalidProperty extends Error {
  constructor(properyName?: string, message?: string) {
    super(message || `property ${properyName} is invalid or not defined`);
  }
}
export class VSCodeExtensionsPackageJsonGenerator {
  private readonly definitionsFile: string | undefined;
  private definitions: Required<GeneratingConfiguration> | undefined;
  private needsUpdate: boolean = false;
  private logger: WebpackLogger | typeof console = console;

  constructor(path: string);
  constructor(options: GeneratingConfiguration);
  constructor(obj?: any) {
    if (typeof obj == 'string') {
      this.definitionsFile = obj;
    } else {
      validateInputConfig(obj);
      this.definitions = { ...defaultConfig, ...obj };
    }
  }

  private static async readDefinitions(
    obj: VSCodeExtensionsPackageJsonGenerator
  ) {
    if (obj.definitionsFile) {
      const definitions = JSON.parse(
        await fs.readFile(obj.definitionsFile, 'utf8')
      );
      validateInputConfig(definitions);
      obj.definitions = { ...defaultConfig, ...definitions };

      if (obj.definitions === undefined)
        throw new Error(
          `could not read definitions file ${obj.definitionsFile}`
        );

      if (
        obj.definitions.configurations === undefined ||
        typeof obj.definitions.configurations !== 'object'
      ) {
        throw new InvalidProperty('configurations');
      }
      if (
        obj.definitions.prefix === undefined ||
        typeof obj.definitions.prefix !== 'string'
      ) {
        throw new InvalidProperty('prefix');
      }
    }
  }

  private static async updatePackageJson(
    obj: VSCodeExtensionsPackageJsonGenerator
  ) {
    if (obj.needsUpdate && obj.definitions !== undefined) {
      const { configurations, prefix, targetFile, tsconfig, tags, sort } =
        obj.definitions;

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

      obj.logger.info(`writing updated json to "${targetFile}"`);
      await fs.writeFile(
        targetFile,
        JSON.stringify(packageJson, undefined, 2).concat('\n')
      );

      obj.needsUpdate = false;
    }
  }

  apply(compiler: Compiler) {
    const thisObj = this;
    this.logger = compiler.getInfrastructureLogger(PLUGIN);

    const updateDefinitions = async () => {
      try {
        await VSCodeExtensionsPackageJsonGenerator.readDefinitions(thisObj);
        thisObj.needsUpdate = true;
        await updatePackageJson();
      } catch (err: any) {
        thisObj.logger.error(`error in ${thisObj.definitionsFile}`);
        thisObj.logger.error(err.message);
        return;
      }
    };
    const updatePackageJson = async () => {
      try {
        await VSCodeExtensionsPackageJsonGenerator.updatePackageJson(thisObj);
      } catch (err: any) {
        thisObj.logger.error(err.message);
        return;
      }
    };

    compiler.hooks.environment.tap(PLUGIN, async () => {
      await updateDefinitions();
    });

    compiler.hooks.afterPlugins.tap(PLUGIN, async () => {
      if (compiler.watchMode && thisObj.definitionsFile) {
        const watcher = fs.watch(thisObj.definitionsFile);
        for await (const event of watcher) {
          if (event.eventType === 'change') {
            await updateDefinitions();
          }
        }
      }
    });

    compiler.hooks.watchRun.tapPromise(PLUGIN, async (comp) => {
      const ino = async (file: string) => {
        return (await fs.stat(file)).ino;
      };
      if (thisObj.definitions && comp.modifiedFiles) {
        // check if modified file is definition file
        const definitions = await Promise.all(
          thisObj.definitions.configurations.map((c) => c.filePath).map(ino)
        );
        const changedFiles = await Promise.all(
          Array.from(comp.modifiedFiles, ino)
        );
        thisObj.needsUpdate ||=
          changedFiles.filter((i) => definitions.includes(i)).length > 0;
      }
    });

    compiler.hooks.done.tap(PLUGIN, async () => {
      await updatePackageJson();
    });
  }
}