import { Database } from 'sqlite';
import { Schema } from './schema';

export type Dict = Record<string, any>;

export enum ORDER_TYPE {
  DESC = 'DESC',
  ASC = 'ASC',
}

export type SelectOrder = { [key: string]: ORDER_TYPE };

export interface FindOpts {
  rows?: boolean;
  limit?: number;
  offset?: number;
  order?: SelectOrder | SelectOrder[];
  fields?: string[];
  group?: string | string[];
}

export interface InsertOpts {
  lastId?: boolean;
}
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
  schema?: Schema;
  indices?: Schema;
}
