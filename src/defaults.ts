import { GeneratingConfiguration } from './types';

export const DEFAULT_TAGS = [
  'markdownDescription',
  'scope',
  'patternErrorMessage',
  'deprecationMessage',
  'enumDescriptions',
  'deprecated',
];

export const defaultConfig: GeneratingConfiguration = {
  configurations: [],
  prefix: '',
  sort: true,
  tags: DEFAULT_TAGS,
  targetFile: 'package.json',
  tsconfig: 'tsconfig.ts',
};
