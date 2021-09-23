import * as assert from 'assert';

import * as vscode from 'vscode';
import { configUtils } from '../../../../dist/utils';
import { Config } from '../config';

suite('Extension Test Suite', () => {
  let configurations: configUtils.ConfigurationHandler<Config>;
  const section = 'conf';
  const testFile = (relative: string) => {
    return vscode.Uri.file(`${__dirname}/${relative}`);
  };

  suiteSetup(() => {
    configurations = new configUtils.ConfigurationHandler<Config>(section);
  });

  vscode.window.showInformationMessage('Start all tests.');

  test('Sample test', () => {
    const uri = testFile('a.py');
    const config = 'resource.insertEmptyLastLine';
    const withLib: any = configurations.get(config, uri);
    const withVscode: any = vscode.workspace
      .getConfiguration('', uri)
      .get(`${section}.${config}`);

    assert.deepStrictEqual(withLib, withVscode);
  });
});
