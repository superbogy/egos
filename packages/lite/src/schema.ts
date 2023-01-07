export enum FieldTypes {
  INT = 'INTEGER',
  REAL = 'REAL',
  NULL = 'NULL',
  TEXT = 'TEXT',
  BLOB = 'BLOB',
}

export interface ColumnSchema {
  type: FieldTypes;
  name?: string;
  nullable?: boolean;
  encode?: (value: any) => any;
  decode?: (value: any) => any;
  pk?: boolean;
  autoIncrement?: boolean;
  default?: any;
  onChange?: (value: any) => any;
}
export interface Schema {
  [key: string]: ColumnSchema;
}

export const TimestampSchema: Schema = {
  createdAt: {
    name: 'created_at',
    type: FieldTypes.TEXT,
    default: () => new Date().toISOString(),
  },
  updatedAt: {
    name: 'updated_at',
    type: FieldTypes.TEXT,
    default: () => new Date().toISOString(),
    onChange: () => new Date().toISOString(),
  },
};

export const PrimarySchema = {
  id: { type: FieldTypes.INT, pk: true },
};

export const merge = (schema: Schema): Schema => {
  return { ...PrimarySchema, ...TimestampSchema, ...schema };
};
