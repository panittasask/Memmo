export type ColumnType =
  | 'text'
  | 'number'
  | 'date'
  | 'action'
  | 'color'
  | 'hyperlink';

export interface ColumnSettings {
  field?: string;
  type: ColumnType;
  text: string;
  width?: number | string;
}
