export type View = 'explorer' | 'search' | 'scm' | 'debug' | 'extensions';

export interface Config {
  /**
   * @default 'explorer'
   * @description 'Window configuration: View to show always when a window opens'
   * @scope 'window'
   */
  'view.showOnWindowOpen': View;

  /**
   * @default {}
   * @description 'Resource configuration: Configure files using glob patterns to have an empty last line always'
   * @scope 'resource'
   */
  'resource.insertEmptyLastLine': { [key: string]: boolean };

  /**
   * @default false
   * @description 'Shows the size of the document'
   * @scope 'language-overridable'
   */
  'language.showSize': boolean;
}
