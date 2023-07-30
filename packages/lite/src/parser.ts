import { Dict } from './interface';
import { objToKVPairs } from './utils';

export const OPERATOR: Record<string, string> = {
  $eq: '=',
  $neq: '!=',
  $gt: '>',
  $lt: '<',
  $gte: '>=',
  $lte: '<=',
  $like: 'LIKE',
  $isNull: 'IS NULL',
  $isNotNull: 'IS NOT NULL',
  $inc: 'inc',
};

export const LOGICAL: Dict = {
  $and: 'AND',
  $or: 'OR',
  $xor: 'XOR',
};

export class Parser {
  private table: string;
  constructor(table: string) {
    this.table = table;
  }
  build(query: Dict | Dict[], op = '$and'): any {
    const data: Record<string, any> = { [op]: [] };
    // [{a: 1}, {b: 1}]
    if (Array.isArray(query)) {
      const res = (query as Dict[]).reduce(
        (acc, cur) => {
          acc[op] = acc[op].concat(cur);
          return acc;
        },
        { [op]: [] },
      );
      return [res];
    }
    // {$and: [{ mail: 2 }, { gender: 'male' }],$or: [{ name: 1 }, { age: 2 }]}
    if (Object.keys(query).length > 1 && (query.$and || query.$or)) {
      return this.build({ $and: [query] });
    }
    const hasLogicOp = this.hasLogicOp(query);
    if (!hasLogicOp) {
      return this.build({ $and: [query] });
    }

    // const q = {
    //   $or: [
    //     { $and: [{ name: 1 }, { age: 2 }] },
    //     { $or: [{ mail: 2 }, { gender: 'male' }] },
    //   ],
    // };
    const [k, v]: [string, any] = Object.entries(query)[0];
    return this.build(v, k);
  }

  hasOperator(valItem: any): boolean {
    if (typeof valItem !== 'object') {
      return false;
    }
    return Object.keys(valItem).some((v) => v in OPERATOR);
  }

  hasLogicOp(valItem: any) {
    if (typeof valItem !== 'object') {
      return false;
    }
    return Object.keys(LOGICAL).some((l) => l in valItem);
  }

  transform(tree: Dict[], lp?: string): { sql: string; params: any[] } {
    const result: { sql: string[]; params: any[] } = {
      sql: [],
      params: [],
    };
    for (const node of tree) {
      for (const lo in node) {
        const item = node[lo];
        const logicLayer = item.find((i: any) => i.$and || i.$or);
        if (logicLayer) {
          return this.transform(item, lo);
        }
        const res = item.map((n: any) => {
          const { sql, params } = this.objectToSql(n);
          result.params = result.params.concat(params);
          return sql;
        });
        const connector = ` ${LOGICAL[lo]} `;
        result.sql.push(`(${res.join(connector)})`);
      }
    }
    const c = lp ? ` ${LOGICAL[lp]} ` : '';
    result.sql = [`(${result.sql.join(c)})`];
    return { sql: result.sql.join(''), params: result.params };
  }

  objectToSql(pair: Dict) {
    const sql: any[] = [];
    const values: any[] = [];
    const pushResult = (res: [string, any[]]) => {
      const [s, val] = res;
      sql.push(s);
      val.map((i) => {
        values.push(i);
      });
    };
    Object.entries(pair).map(([k, v]) => {
      if (typeof v === 'object') {
        Object.entries(v).map((cur) => {
          const [op, v] = cur;
          const res = this.joinKV(op, k, v);
          pushResult(res);
        }, []);
      } else {
        const res = this.joinKV('$eq', k, v);
        pushResult(res);
      }
    });
    return { sql: sql.join(' and '), params: values };
  }

  joinKV(op: string, key: string, value?: any): [s: string, v: any] {
    const field = this.table ? `${this.table}.${key}` : key;
    if (op === '$inc') {
      return [this.increment(field, value), []];
    }
    if (op in OPERATOR) {
      const opStr = OPERATOR[op] as string;
      return [`${field} ${opStr} ?`, [value]];
    }
    const func = this.sqlFunction(op, field);
    const placeholder = Array.isArray(value)
      ? Array(value.length).fill('?').join(',')
      : '?';
    return [
      func.replace('%s', placeholder),
      Array.isArray(value) ? value : value ? [value] : [],
    ];
  }

  parse(entities: any): { sql: string; params: any[] } {
    const tree = this.build(objToKVPairs(entities));
    return this.transform(tree);
  }

  private increment(field: string, value: any) {
    if (isNaN(value)) {
      throw new Error('mews increment value must be number');
    }

    return `${field} = ${field} + ${value}`;
  }

  private sqlFunction(name: string, filed: String): string {
    if (name.startsWith('$')) {
      return `${filed} ${name.toUpperCase().replace('$', '')}(%s)`;
    }

    return `${name}(${filed})`;
  }
}
