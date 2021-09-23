import * as vscode from 'vscode';
import { configUtils } from '../../../dist/utils';
import { Config } from './config';
import type { View } from './config';

const configurations = new configUtils.ConfigurationHandler<Config>('conf');

export function activate(context: vscode.ExtensionContext) {
  // Example: Reading Window scoped configuration
  const configuredView = configurations.get('view.showOnWindowOpen');
  switch (configuredView) {
    case 'explorer':
      vscode.commands.executeCommand('workbench.view.explorer');
      break;
    case 'search':
      vscode.commands.executeCommand('workbench.view.search');
      break;
    case 'scm':
      vscode.commands.executeCommand('workbench.view.scm');
      break;
    case 'debug':
      vscode.commands.executeCommand('workbench.view.debug');
      break;
    case 'extensions':
      vscode.commands.executeCommand('workbench.view.extensions');
      break;
  }

  // Example: Updating Window scoped configuration
  vscode.commands.registerCommand(
    'config.commands.configureViewOnWindowOpen',
    async () => {
      // 1) Getting the value
      const value = (await vscode.window.showQuickPick(
        ['explorer', 'search', 'scm', 'debug', 'extensions'],
        { placeHolder: 'Select the view to show when opening a window.' }
      )) as View | undefined;

      if (value === undefined) {
        // nothing was selected
        return;
      }

      if (vscode.workspace.workspaceFolders) {
        // 2) Getting the Configuration target
        const target = await vscode.window.showQuickPick(
          [
            {
              label: 'User',
              description: 'User Settings',
              target: vscode.ConfigurationTarget.Global,
            },
            {
              label: 'Workspace',
              description: 'Workspace Settings',
              target: vscode.ConfigurationTarget.Workspace,
            },
          ],
          { placeHolder: 'Select the view to show when opening a window.' }
        );

        if (value && target) {
          // 3) Update the configuration value in the target
          await configurations.update(
            'view.showOnWindowOpen',
            value,
            undefined,
            target.target
          );
        }
      } else {
        // 2) Update the configuration value in User Setting in case of no workspace folders
        await configurations.update(
          'view.showOnWindowOpen',
          value,
          undefined,
          vscode.ConfigurationTarget.Global
        );
      }
    }
  );

  // Example: Reading Resource scoped configuration for a file
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((e) => {
      // 1) Get the configured glob pattern value for the current file
      const value: any = configurations.get(
        'resource.insertEmptyLastLine',
        e.uri
      );

      // 2) Check if the current resource matches the glob pattern
      const matches = value ? value[e.fileName] : undefined;

      // 3) If matches, insert empty last line
      if (matches) {
        vscode.window.showInformationMessage(
          'An empty line will be added to the document ' + e.fileName
        );
      }
    })
  );

  // Example: Updating Resource scoped Configuration for current file
  vscode.commands.registerCommand(
    'config.commands.configureEmptyLastLineCurrentFile',
    async () => {
      if (vscode.window.activeTextEditor) {
        const currentDocument = vscode.window.activeTextEditor.document;

        // 1) Get the configuration value
        const currentValue = configurations.get(
          'resource.insertEmptyLastLine',
          currentDocument.uri,
          {}
        );

        // 2) Choose target to Global when there are no workspace folders
        const target = vscode.workspace.workspaceFolders
          ? vscode.ConfigurationTarget.WorkspaceFolder
          : vscode.ConfigurationTarget.Global;

        const value = {
          ...currentValue,
          ...{ [currentDocument.fileName]: true },
        };

        // 3) Update the configuration
        await configurations.update(
          'resource.insertEmptyLastLine',
          value,
          undefined,
          target
        );
      }
    }
  );

  // Example: Updating Resource scoped Configuration
  vscode.commands.registerCommand(
    'config.commands.configureEmptyLastLineFiles',
    async () => {
      // 1) Getting the value
      const value = await vscode.window.showInputBox({
        prompt: 'Provide glob pattern of files to have empty last line.',
      });

      if (vscode.workspace.workspaceFolders) {
        // 2) Getting the target
        const target = await vscode.window.showQuickPick(
          [
            {
              label: 'Application',
              description: 'User Settings',
              target: vscode.ConfigurationTarget.Global,
            },
            {
              label: 'Workspace',
              description: 'Workspace Settings',
              target: vscode.ConfigurationTarget.Workspace,
            },
            {
              label: 'Workspace Folder',
              description: 'Workspace Folder Settings',
              target: vscode.ConfigurationTarget.WorkspaceFolder,
            },
          ],
          {
            placeHolder:
              'Select the target to which this setting should be applied',
          }
        );

        if (value && target) {
          if (target.target === vscode.ConfigurationTarget.WorkspaceFolder) {
            // 3) Getting the workspace folder
            const workspaceFolder = await vscode.window.showWorkspaceFolderPick(
              {
                placeHolder:
                  'Pick Workspace Folder to which this setting should be applied',
              }
            );
            if (workspaceFolder) {
              // 4) Get the current value
              const currentValue = configurations.get(
                'resource.insertEmptyLastLine',
                workspaceFolder.uri
              );

              const newValue = { ...currentValue, ...{ [value]: true } };

              // 5) Update the configuration value
              await configurations.update(
                'resource.insertEmptyLastLine',
                newValue,
                undefined,
                target.target
              );
            }
          } else {
            // 4) Get the current value
            const currentValue = configurations.get(
              'resource.insertEmptyLastLine'
            );

            const newValue = {
              ...currentValue,
              ...(value ? { [value]: true } : {}),
            };

            // 3) Update the value in the target
            await configurations.update(
              'resource.insertEmptyLastLine',
              newValue,
              undefined,
              target.target
            );
          }
        }
      } else {
        // 2) Get the configuration

        // 3) Get the current value
        const currentValue = configurations.get('resource.insertEmptyLastLine');

        const newValue = {
          ...currentValue,
          ...(value ? { [value]: true } : {}),
        };

        // 4) Update the value in the User Settings
        await configurations.update(
          'resource.insertEmptyLastLine',
          newValue,
          undefined,
          vscode.ConfigurationTarget.Global
        );
      }
    }
  );

  let statusSizeDisposable: vscode.Disposable;
  // Example: Reading language overridable configuration for a document
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((e) => {
      if (statusSizeDisposable) {
        statusSizeDisposable.dispose();
      }

      // 1) Check if showing size is configured for current file
      const showSize: any = configurations.get('language.showSize', e);

      // 3) If matches, insert empty last line
      if (showSize) {
        statusSizeDisposable = vscode.window.setStatusBarMessage(
          `${e.getText().length}`
        );
      }
    })
  );

  // Example: Overriding configuration value for a language
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'config.commands.overrideLanguageValue',
      async () => {
        // 1) Getting the language id
        const languageId = await vscode.window.showInputBox({
          placeHolder: 'Enter the language id',
        });

        // 2) Update
        configurations.update(
          'language.showSize',
          true,
          { languageId: languageId! },
          false,
          true
        );
      }
    )
  );

  // Example: Listening to configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('conf.resource.insertEmptyLastLine')) {
        if (vscode.window.activeTextEditor) {
          const currentDocument = vscode.window.activeTextEditor.document;

          // 1) Get the configured glob pattern value for the current file
          const value = configurations.get(
            'resource.insertEmptyLastLine',
            currentDocument.uri,
            {}
          );

          // 2) Check if the current resource matches the glob pattern
          const matches = value[currentDocument.fileName];

          // 3) If matches, insert empty last line
          if (matches) {
            vscode.window.showInformationMessage(
              'An empty line will be added to the document ' +
                currentDocument.fileName
            );
          }
        }
      }

      // Check if a language configuration is changed for a text document
      if (
        e.affectsConfiguration(
          'conf.language.showSize',
          vscode.window.activeTextEditor?.document
        )
      ) {
        // noop
      }

      // Check if a language configuration is changed for a language
      if (
        e.affectsConfiguration('conf.language.showSize', {
          languageId: 'typescript',
        })
      ) {
        // noop
      }
    })
  );
}
