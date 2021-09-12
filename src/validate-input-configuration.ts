import Ajv from 'ajv';
import betterAjvErrors from '@stoplight/better-ajv-errors';
import { createGenerator } from 'ts-json-schema-generator';
import { GeneratingConfiguration } from './types';
import { JSONSchema7 } from 'json-schema';

const type = 'GeneratingConfiguration';
const generator = createGenerator({
  path: `${__dirname}/types.d.ts`,
  type: type,
  jsDoc: 'none',
  extraTags: undefined,
});
const schema: JSONSchema7 = generator.createSchema(type);
// @ts-expect-error. set minItems for stuff that ts can't see
schema.definitions.GeneratingConfiguration.properties.configurations.minItems = 1;

const ajv = new Ajv();

export function validateInputConfig(options: any) {
  const validate = ajv.compile<GeneratingConfiguration>(schema);
  const res = validate(options);
  return res
    ? true
    : betterAjvErrors(schema, validate.errors, {
        propertyPath: [],
        targetValue: options,
      });
}
