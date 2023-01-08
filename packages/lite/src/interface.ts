import { Database } from 'sqlite';

export type Dict = {
  [key: string]: any;
};

export interface Connection {
  filename: string;
  mode?: number;
  driver?: any;
}

export interface ModelOpts {
  onInsert?: (row: Dict) => any;
  onRemove?: (row: Dict) => any;
  db?: Database;
  timestamp?: boolean;
  debug?: boolean;
}
