import { Dict } from './interface';
import { objToKVPairs } from './utils';

const OPERATOR: Record<string, string> = {
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

const LOGICAL: Dict = {
  $and: 'AND',
  $or: 'OR',
  $xor: 'XOR',
};

export class Parser {
  buildTree(query: Dict | Dict[], op = '$and'): any[] {
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
    if (typeof query === 'object') {
      // {$and: [{ mail: 2 }, { gender: 'male' }],$or: [{ name: 1 }, { age: 2 }]}
      if (Object.keys(query).length > 1 && (query.$and || query.$or)) {
        return this.buildTree({ $and: query });
      }
      // const q = {
      //   $or: [
      //     { $and: [{ name: 1 }, { age: 2 }] },
      //     { $or: [{ mail: 2 }, { gender: 'male' }] },
      //   ],
      // };
      const res = Object.entries(query).reduce((acc, cur) => {
        const [k, v] = cur;
        if (k in LOGICAL) {
          if (!acc[k]) {
            acc[k] = [];
          }
          const t = this.buildTree(v, k);
          return Object.assign(acc, t);
        } else {
          acc[op].push({ [k]: v });
        }
        return acc;
      }, data);
      return [res];
    }

    return [data];
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
          const { sql, params } = this.pairToSql(n);
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

  pairToSql(pair: Dict) {
    const sql: any[] = [];
    const values: any[] = [];
    const pushResult = (res: [string, any[]]) => {
      const [s, val] = res;
      console.log(res);
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
    return { sql: sql.join('and'), params: values };
  }

  joinKV(op: string, key: string, value: any): [s: string, v: any] {
    if (op === '$inc') {
      return [this.increment(key, value), []];
    }
    if (op in OPERATOR) {
      const opStr = OPERATOR[op] as string;
      return [`${key} ${opStr} ?`, [value]];
    }
    const func = this.sqlFunction(op);
    const placeholder = Array.isArray(value)
      ? Array(value.length).fill('?').join(',')
      : '?';
    return [
      `${key} ${func.replace('%s', placeholder)}`,
      Array.isArray(value) ? value : [value],
    ];
  }

  parse(entities: any): { sql: string; params: any[] } {
    const tree = this.buildTree(objToKVPairs(entities));
    return this.transform(tree);
  }

  private increment(field: string, value: any) {
    if (isNaN(value)) {
      throw new Error('mews increment value must be number');
    }

    return '=`' + field + '` + ' + value;
  }

  private sqlFunction(name: string): string {
    return name.toUpperCase().replace('$', '') + '(%s)';
  }

  free(): void {}
}
