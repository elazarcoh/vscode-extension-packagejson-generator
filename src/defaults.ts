import type { GeneratingConfiguration } from './types';

export const DEFAULT_TAGS = [
  'description',
  'markdownDescription',
  'default',
  'scope',
  'enumDescriptions',
  'deprecationMessage',
  'markdownDeprecationMessage',
  'deprecated',
  'order',
  'minimum',
  'maximum',
  'maxLength',
  'minLength',
  'pattern',
  'patternErrorMessage',
  'format',
  'maxItems',
  'minItems',
  'editPresentation',
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
