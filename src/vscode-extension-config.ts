import deepEqual from 'deep-equal';
import { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import { createGenerator } from 'ts-json-schema-generator';

function copyProperty(
  current: JSONSchema7Definition | undefined,
  value: JSONSchema7Definition
): JSONSchema7Definition {
  if (typeof current !== 'object') return value;
  if (typeof value !== 'object') return value;

  if (deepEqual(current, value)) return current;

  const newKeys = new Set(Object.keys(value) as (keyof JSONSchema7)[]);
  // Alias of current to make types easier.
  const rr: Partial<Record<string, any>> = current;

  for (const key of Array.from(newKeys.keys())) {
    rr[key] = value[key];
  }

  for (const key of Object.keys(rr)) {
    if (!newKeys.has(key as keyof JSONSchema7)) delete rr[key];
  }

  return current;
}

function mergeObjects(
  o1: { [key: string]: JSONSchema7Definition },
  o2: { [key: string]: JSONSchema7Definition },
  onDuplicateKey: 'error' | 'first' | 'second' = 'error'
) {
  const target: Record<string, any> = {};
  for (const [key, value] of Object.entries(o1)) {
    target[key] = copyProperty(o1[key], value);
  }
  for (const [key, value] of Object.entries(o2)) {
    if (target.hasOwnProperty(key)) {
      switch (onDuplicateKey) {
        case 'error':
          throw new Error(`duplicate key: ${key}`);
        case 'first':
          break;
        case 'second':
          target[key] = copyProperty(o2[key], value);
          break;
        default:
          break;
      }
    } else {
      target[key] = copyProperty(o2[key], value);
    }
  }
  return target;
}

function sortObject(o: Record<string, any>): Record<string, any> {
  return Object.keys(o)
    .sort()
    .reduce((obj, key) => {
      obj[key] = o[key];
      return obj;
    }, {} as Record<string, any>);
}

export function createConfigurationObject(
  configPrefix: string,
  configInterfacesDef: { filePath: string; name: string }[],
  tsconfig: string | undefined = 'tsconfig.json',
  tags: string[] = DEFAULT_TAGS,
  sort: boolean = true
): JSONSchema7 {
  const schema = configInterfacesDef
    .map(
      (c) =>
        createGenerator({
          expose: 'none',
          topRef: false,
          path: c.filePath,
          extraTags: tags,
          tsconfig: tsconfig,
        }).createSchema(c.name).properties
    )
    .filter((d): d is { [key: string]: JSONSchema7Definition } => {
      return d !== undefined;
    })
    .reduce((dr, d) => mergeObjects(dr, d));

  // set the config properties
  const props = Object.entries(schema).map(
    ([key, value]) =>
      [`${configPrefix}.${key}`, value] as [string, JSONSchema7Definition]
  );
  const propsMap = new Map(props);
  const { properties = {} } = {} as JSONSchema7;

  for (const [key, value] of props) {
    properties[key] = copyProperty(properties[key], value);
  }

  // Remove unknown properties
  for (const [key] of Object.entries(properties)) {
    if (!propsMap.has(key)) delete properties[key];
  }

  return { properties: sort ? sortObject(properties) : properties };
}

export const DEFAULT_TAGS = [
  'markdownDescription',
  'scope',
  'patternErrorMessage',
  'deprecationMessage',
  'enumDescriptions',
  'deprecated',
];
