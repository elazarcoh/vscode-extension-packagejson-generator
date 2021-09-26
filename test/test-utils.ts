import * as fs from 'fs/promises';
import path from 'path';

export async function exists(path: string): Promise<boolean> {
  return fs
    .access(path)
    .then((_) => true)
    .catch((_) => false);
}

export const extensionPath = path.resolve(
  `${__dirname}/extension-example-configuration/`
);
