import { ColumnSchema } from './schema';

export const objToKVPairs = (obj: any): any[] => {
  if (Array.isArray(obj)) {
    return obj.reduce((acc, cur) => {
      return acc.concat(objToKVPairs(cur));
    }, []);
  }
  return Object.entries(obj).reduce((acc, [k, v]) => {
    const val = Array.isArray(v) ? objToKVPairs(v) : v;
    acc.push({ [k]: val });
    return acc;
  }, [] as any[]);
};

export const columnToSql = (column: ColumnSchema) => {
  let def: any = '';
  if (column.default !== undefined) {
    def =
      typeof column.default === 'function' ? column.default() : column.default;
    def = `DEFAULT '${def}'`;
  }
  const colSql = [
    `\`${column.name}\``,
    column.type,
    column.nullable ? '' : 'NOT NULL',
    def,
    column.pk ? 'PRIMARY KEY' : '',
    column.autoIncrement ? 'AUTOINCREMENT' : '',
  ];
  return colSql.filter((i) => i).join(' ');
};

export const genSql = (table: string, schema: Record<string, ColumnSchema>) => {
  const sql = Object.values(schema).map((column: ColumnSchema) => {
    return columnToSql(column);
  });
  return [
    `CREATE TABLE IF NOT EXISTS \`${table}\`(`,
    `  ${sql.join(',\n  ')}`,
    ')',
  ].join('\n');
};
