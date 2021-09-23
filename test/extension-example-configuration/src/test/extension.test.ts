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

  test('test getter', () => {
    const uri = testFile('a.py');
    const config: keyof Config = 'resource.insertEmptyLastLine';
    const withLib = configurations.get(config, uri);
    const withVscode = vscode.workspace
      .getConfiguration('', uri)
      .get(`${section}.${config}`);

    assert.deepStrictEqual(withLib, withVscode);
  });

  test('test update (no scope)', async () => {
    const config: keyof Config = 'language.showSize';
    const languageId = 'python';
    const scope = undefined;
    const newValue = true;

    await configurations.update(
      'language.showSize',
      newValue,
      scope,
      false,
      true
    );

    const withVscode = vscode.workspace
      .getConfiguration('', scope)
      .get(`${section}.${config}`);

    assert.strictEqual(newValue, withVscode);
  });

  test('test update (with scope)', async () => {
    const config: keyof Config = 'language.showSize';
    const languageId = 'python';
    const scope = { languageId: languageId };
    const newValue = true;

    await configurations.update(
      'language.showSize',
      newValue,
      scope,
      false,
      true
    );

    const withVscode = vscode.workspace
      .getConfiguration('', scope)
      .get(`${section}.${config}`);

    assert.strictEqual(newValue, withVscode);
  });
});
