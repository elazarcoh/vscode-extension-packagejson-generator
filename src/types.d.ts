interface PackageJson {
  contributes: {
    configuration: { [key: string]: any };
  };
}

interface ConfigEntry {
  filePath: string;
  name: string;
}

interface GeneratingConfiguration {
  configurations: ConfigEntry[];
  prefix: string;
  targetFile: string;
  tsconfig?: string;
  tags: string[];
  sort: boolean;
}
