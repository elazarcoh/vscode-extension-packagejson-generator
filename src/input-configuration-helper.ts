import Ajv from 'ajv';
import betterAjvErrors, { IOutputError } from 'better-ajv-errors';
import { createGenerator } from 'ts-json-schema-generator';
import { GeneratingConfiguration } from './types';
import * as fs from 'fs/promises';
import JSON5 from 'json5';
import { JSONSchema7 } from 'json-schema';
import { defaultConfig } from './defaults';
import path from 'path';

const schema: JSONSchema7 = {
  "$ref": "#/definitions/GeneratingConfiguration",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "definitions": {
    "ConfigEntry": {
      "additionalProperties": false,
      "properties": {
        "filePath": {
          "type": "string"
        },
        "name": {
          "type": "string"
        }
      },
      "required": [
        "filePath",
        "name"
      ],
      "type": "object"
    },
    "GeneratingConfiguration": {
      "additionalProperties": false,
      "properties": {
        "configurations": {
          "items": {
            "$ref": "#/definitions/ConfigEntry"
          },
          "type": "array"
        },
        "prefix": {
          "type": "string"
        },
        "sort": {
          "type": "boolean"
        },
        "tags": {
          "items": {
            "type": "string"
          },
          "type": "array"
        },
        "targetFile": {
          "type": "string"
        },
        "templateFile": {
          "type": "string"
        },
        "tsconfig": {
          "type": "string"
        }
      },
      "required": [
        "configurations",
        "prefix"
      ],
      "type": "object"
    }
  }
}
// @ts-expect-error. set minItems for stuff that ts can't see
schema.definitions.GeneratingConfiguration.properties.configurations.minItems = 1;

const ajv = new Ajv();

export class InvalidConfigurationError extends Error {
  constructor(readonly validationErrors: IOutputError[]) {
    super(validationErrors.join('\n'));
  }
}

export function withDefaultConfig(definitions: GeneratingConfiguration): Required<GeneratingConfiguration> {

  const completeConfiguration: Required<GeneratingConfiguration> = {
    ...defaultConfig,
    ...definitions,
    ...{
      templateFile:
        definitions.templateFile ??
        definitions.targetFile ??
        defaultConfig.targetFile,
    },
  };
  return {
    ...completeConfiguration,
    ...{
      targetFile: completeConfiguration.targetFile,
      templateFile: completeConfiguration.templateFile,
      tsconfig: completeConfiguration.tsconfig,
      configurations: completeConfiguration.configurations.map((c) => ({
        ...c,
        filePath: c.filePath,
      })),
    },
  };
}

export async function readGeneratingConfiguration(
  inputFile: string
): Promise<Required<GeneratingConfiguration>> {
  const dirname = path.dirname(inputFile);
  const relativeToInput = (relativePath: string): string => {
    return path.resolve(dirname, relativePath);
  };

  const definitions = JSON5.parse(await fs.readFile(inputFile, 'utf8'));
  validateInputConfig(definitions);
  const completeConfiguration = withDefaultConfig(definitions);

  return {
    ...completeConfiguration,
    ...{
      targetFile: relativeToInput(completeConfiguration.targetFile),
      templateFile: relativeToInput(completeConfiguration.templateFile),
      tsconfig: relativeToInput(completeConfiguration.tsconfig),
      configurations: completeConfiguration.configurations.map((c) => ({
        ...c,
        filePath: relativeToInput(c.filePath),
      })),
    },
  };
}

export function validateInputConfig(
  definitions: any
): definitions is GeneratingConfiguration {
  const validate = ajv.compile<GeneratingConfiguration>(schema);
  const res = validate(definitions);

  if (res) {
    return true;
  } else {
    const errors = betterAjvErrors(schema, definitions, validate.errors, { format: 'js' }) ?? [];
    throw new InvalidConfigurationError(typeof errors === 'string' ? [errors] : errors);
  }
}
