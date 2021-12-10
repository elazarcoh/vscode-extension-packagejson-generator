import { Compilation, Compiler } from 'webpack';
import { createConfigurationObject } from '../vscode-extension-config';
import * as fs from 'fs/promises';
import { GeneratingConfiguration, PackageJson } from '../types';
import {
  InvalidConfigurationError,
  readGeneratingConfiguration,
  validateInputConfig,
  withDefaultConfig,
} from '../input-configuration-helper';
type WebpackLogger = ReturnType<Compilation['getLogger']>;

const PLUGIN = 'VSCode Extension Config Generator';

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
      try {
        validateInputConfig(obj);
      } catch (err) {
        obj.logger.error(`invalid input webpack config object`);
        if (err instanceof InvalidConfigurationError) {
          obj.logger.error(err.validationErrors);
        } else {
          obj.logger.error(err);
        }
        throw err;
      }
      this.definitions = withDefaultConfig(obj);
    }
  }

  private static async readDefinitions(
    obj: VSCodeExtensionsPackageJsonGenerator
  ) {
    if (!obj.definitionsFile) {
      return false;
    }
    try {
      obj.definitions = await readGeneratingConfiguration(obj.definitionsFile);
      return true;
    } catch (err) {
      obj.logger.error(`invalid input webpack config object`);
      if (err instanceof InvalidConfigurationError) {
        obj.logger.error(err.validationErrors);
      } else {
        obj.logger.error(err);
      }
      return false;
    }
  }

  private static async updatePackageJson(
    obj: VSCodeExtensionsPackageJsonGenerator
  ) {
    if (obj.needsUpdate && obj.definitions !== undefined) {
      const {
        configurations,
        prefix,
        templateFile,
        targetFile,
        tsconfig,
        tags,
        sort,
      } = obj.definitions;

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
        thisObj.needsUpdate = !compiler.options.watch ||
          await VSCodeExtensionsPackageJsonGenerator.readDefinitions(thisObj);
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

    // here I wanted to use the compiler.watchMode flag, but it seems to be `false`
    // in all hooks before starting the compilation, so I resolved to use the watchRun hook.
    let watcher: ReturnType<typeof fs.watch> | undefined;
    compiler.hooks.watchRun.tap(PLUGIN, async () => {
      if (!watcher && thisObj.definitionsFile) {
        watcher = fs.watch(thisObj.definitionsFile);
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
