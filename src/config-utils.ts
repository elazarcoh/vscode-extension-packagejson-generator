import { workspace } from 'vscode';

export function ConfigurationGetter<C extends { [key: string]: any }>(
  section: string
) {
  const config = workspace.getConfiguration(section);
  return <K extends keyof C>(subsection: K) => {
    // @ts-expect-error subsection is always of type string, even though the compiler doesn't see it
    return config.get<C[K]>(subsection);
  };
}
