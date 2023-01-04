export type Dict = {
  [key: string]: any
}

export interface ColumnSchema {

  type: string;
  name?: string;
  autoTimestamp?: boolean;
  encode?: (value: any) => any;
  decode?: (value: any) => any;
  pk?: boolean;
  default?: any;
  onChange?: (value: any) => any;
}
export interface Schema {
  [key: string]: ColumnSchema
}

export interface Connection {
  filename: string;
  mode?: number;
  driver?: any;
}

export interface ModelOpts {
  table?: string;
  connection?: Connection;
  schema?: Schema;
  debug?: boolean;
}
