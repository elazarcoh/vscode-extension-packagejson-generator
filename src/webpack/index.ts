import { Compilation } from 'webpack';
export type WebpackLogger = ReturnType<Compilation['getLogger']>;

export const PLUGIN = 'VSCode Extension Config Generator';


