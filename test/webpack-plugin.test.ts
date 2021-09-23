import assert from 'assert';
import webpack from 'webpack';
import { exists, extensionPath } from './test-utils';
import * as fs from 'fs/promises';

const relativeToExtension = (path: string) => `${extensionPath}/${path}`;
const options = require(relativeToExtension('webpack.config'));

describe('webpack-plugin', () => {
  after('vscode-extension', async function () {
    this.timeout(10000);
    if (await exists(relativeToExtension('package.json')))
      await fs.unlink(relativeToExtension('package.json'));
    if (await exists(relativeToExtension('out')))
      await fs.rm(relativeToExtension('out'), { recursive: true, force: true });
  });

  it('should emit package.json', async () => {
    const runWebpack = () => {
      return new Promise<webpack.Stats>((resolve, reject) => {
        webpack(options, (err, stats) => {
          if (err) {
            reject(err);
          } else if (stats!.hasErrors()) {
            reject(stats!.toString());
          }
          resolve(stats!);
        });
      });
    };
    try {
      const stats = await runWebpack();
      assert.ok(await exists(options.plugins[0].definitions.targetFile));
    } catch (err) {
      assert.fail(err as string | Error);
    }
  }).timeout(10 * 1000);
});
