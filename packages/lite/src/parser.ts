import { sprintf } from 'printj'
import { Dict } from './interface';


const OPERATOR: Dict = {
  '$eq': '=',
  '$neq': '!=',
  '$gt': '>',
  '$lt': '<',
  '$gte': '>=',
  '$lte': '<=',
  '$like': 'LIKE',
  '$isNull': 'IS NULL',
  '$isNotNull': 'IS NOT NULL',
  '$inc': true,
};

const LOGICAL: Dict = {
  $and: 'AND',
  $or: 'OR',
  $xor: 'XOR'
}

interface Node {
  type: string;
  name: string;
  value: any;
  isChild: boolean;
  connector?: string;
}

export class Parser {
  private tree: Node[];
  constructor() {
    this.tree = [];
  }

  getNodeByKV(key: string, value: any): void {
    Object.entries(value).map(([op, v]) => {
      const node: Node = {
        type: 'field',
        name: key,
        value: { [op]: v },
        isChild: true,
        connector: ' AND '
      };
      this.tree.push(node);
    });
  }

  genNode(entities: Dict, isChild = false): void {
    Object.entries(entities).forEach(([key, v]: [key: string, v: any]) => {
      const value = v && typeof v === 'object' ? v : { $eq: v };
      if (!(key in LOGICAL)) {
        if (Array.isArray(value)) {
          value.forEach(i => {
            this.genNode(i, true);
          });
        } else {
          this.getNodeByKV(key, value);
        }
      } else {
        const node: Node = {
          type: 'logical',
          name: LOGICAL[key],
          value,
          isChild,
        };
        this.tree.push(node);

        this.genNode(value, true);
      }
    });
  }

  getDefaultNode(isChild: boolean): Node {
    return {
      type: 'operator',
      name: 'and',
      value: isChild ? 0 : 1,
      isChild,
    };
  }


  parse(entities: any): { sql: string, params: any[] } {
    this.genNode(entities);
    const sql: string[] = [];
    let prev: Node;
    let level = 0;
    const params = [];
    this.tree.forEach((node: Node) => {
      if (node.type === 'field') {
        if (prev && prev.type !== 'field') {
          sql.push(')')
        }
        const res = this.parseFieldNode(node);
        sql.push(res.sql);
        res.values.map((v: any) => params.push(v));
      } else {
        sql.push(this.parseLogicalNode(node));
        if (!node.isChild) {
          sql.push('(');
          level += 1;
        } else if (level) {
          sql.push(')');
          level -= 1;
        }
      }
      prev = node;
    });
    if (level) {
      sql.push(')');
    }
    this.free();
    return { sql: sql.join('').replace(/(.*)and/i, '$1'), params };
  }

  parseFieldNode(node: Node): Dict {
    let fieldStr = '';
    const field = '`' + node.name + '`';
    const connector = node.connector?.toUpperCase().substr(1);
    const values = [];
    Object.entries(node.value).forEach(element => {
      const operator: string = element[0];
      const value = element[1];
      // const name = `$${node.name}`;
      const temp = [field];
      if (operator === '$inc') {
        temp.push(this.increment(node.name, value));
      } else if (OPERATOR[operator]) {
        temp.push(OPERATOR[operator]);
        temp.push('?')
        values.push(value);
      } else {
        const func = this.sqlFunction(operator);
        if (Array.isArray(value)) {
          temp.push(sprintf(func, Array(value.length).fill('?').join(',')));
          value.map(v => values.push(v));
        } else {
          temp.push(sprintf(func, '?'));
          values.push(value?.toString());
        }
      }
      temp.push(connector);
      fieldStr += temp.join(' ');
    });
    return { sql: fieldStr, values };
  }

  parseLogicalNode(node: Node): string {
    return ` ${node.name} `;
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

  free(): void {
    this.tree = [];
  }
}
