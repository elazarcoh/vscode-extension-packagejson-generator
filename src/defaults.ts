import type { GeneratingConfiguration } from './types';

export const DEFAULT_TAGS = [
  'markdownDescription',
  'scope',
  'patternErrorMessage',
  'deprecationMessage',
  'enumDescriptions',
  'deprecated',
];

export const defaultConfig: Omit<
  Required<GeneratingConfiguration>,
  'configurations' | 'prefix' | 'templateFile'
> = {
  sort: true,
  tags: DEFAULT_TAGS,
  targetFile: 'package.json',
  tsconfig: 'tsconfig.json',
};
