import { workspace } from 'vscode';

export function ConfigurationGetter<C extends { [key: string]: any }>(
  section: string
) {
  return <K extends keyof C>(subsection: K) => {
    const config = workspace.getConfiguration(section);
    // @ts-expect-error subsection is always of type string, though the compiler doesn't see it
    return config.get<C[K]>(subsection);
  };
}
