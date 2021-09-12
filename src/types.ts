import { JTDDataType, JTDSchemaType } from 'ajv/dist/jtd';
export interface PackageJson {
  contributes: {
    configuration: { [key: string]: any };
  };
}

export interface ConfigEntry {
  filePath: string;
  name: string;
}

export interface GeneratingConfiguration {
  configurations: ConfigEntry[];
  prefix: string;
  targetFile?: string;
  tsconfig?: string;
  tags?: string[];
  sort?: boolean;
}
