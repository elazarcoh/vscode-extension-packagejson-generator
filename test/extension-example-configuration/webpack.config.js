//@ts-check
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

'use strict';

const { VSCodeExtensionsPackageJsonGenerator } = require('../../dist/webpack');

const path = require('path');

const absolute = (...parts) => path.resolve(__dirname, ...parts);

const config = {
  target: 'node',

  entry: absolute('./src/extension.ts'),
  output: {
    path: absolute('dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]',
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded.
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
  plugins: [
    new VSCodeExtensionsPackageJsonGenerator(
      absolute('vscode-extension-config.json')
    ),
  ],
};
module.exports = config;
