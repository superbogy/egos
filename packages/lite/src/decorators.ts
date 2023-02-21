import 'reflect-metadata';
import { Database } from 'sqlite3';
import { open, ISqlite } from 'sqlite';
import { ColumnSchema } from './schema';
import fs from 'fs';
import path from 'path';

export function column(params: ColumnSchema): PropertyDecorator {
  return function (target, key) {
    const name = toSnakeCase(params.name || (key as string));
    const prop = Reflect.getMetadata('model:schema', target) || {};
    params.name = name;
    prop[key] = params;
    Reflect.defineMetadata('model:schema', prop, target);
  };
}

export function index(params: any) {
  return function (target: any, key: string) {
    const name = toSnakeCase(params.name || key);
    const indices = Reflect.getMetadata('model:indices', target) || {};
    indices[name] = {
      name: `${name}_idx`,
      unique: !!params.unique,
      columns: params.columns,
      condition: params.condition,
    };
    Reflect.defineMetadata('model:indices', indices, target);
  };
}

export function table(table: string) {
  return function (constructor: Function) {
    constructor.prototype._table = table;
  };
}

export interface ConnectConfig {
  filename: string;
  mode?: number;
  driver?: any;
}

export interface DelayConnectionConfig {
  name: string;
  filename?: string;
}

export const connections: Record<string, any> = {};

const delayConnect = (name: string) => () => {
  return connections[name];
};

export function connect(name: string, config?: ISqlite.Config) {
  return function (constructor: Function) {
    if (!connections[name] && !config) {
      constructor.prototype._db = delayConnect(name);
    } else {
      constructor.prototype._db = addConnection(name, config as ConnectConfig);
    }
  };
}

export const addConnection = async (name: string, config: ConnectConfig) => {
  if (!connections[name]) {
    if (config.filename && !fs.existsSync(path.dirname(config.filename))) {
      fs.mkdirSync(path.dirname(config.filename));
    }
    const conn = await open({
      filename: config.filename,
      driver: config.driver || Database,
      mode: config.mode,
    });
    connections[name] = conn;
  }
  return connections[name];
};

// export function Entity<T>(
//   params: {
//     name?: string;
//     primary?: (keyof T)[];
//     index?: (
//       | (keyof T)[]
//       | {
//           name: string;
//           keys: (keyof T)[];
//         }
//     )[];
//     unique?: (
//       | (keyof T)[]
//       | {
//           name: string;
//           keys: (keyof T)[];
//         }
//     )[];
//     timestamp?:
//       | boolean
//       | {
//           createdAt?: boolean;
//           updatedAt?: boolean;
//         };
//     withoutRowID?: boolean;
//   } = {},
// ): ClassDecorator {
//   return function (target) {
//     let timestamp = {
//       createdAt: false,
//       updatedAt: false,
//     };

//     if (params.timestamp) {
//       if (params.timestamp === true) {
//         timestamp = {
//           createdAt: true,
//           updatedAt: true,
//         };
//       } else {
//         Object.assign(timestamp, JSON.parse(JSON.stringify(params.timestamp)));
//       }
//     }

//     const { createdAt, updatedAt } = timestamp;

//     const name = toSnakeCase(params.name || target.name);
//     const primary =
//       Reflect.getMetadata('sqlite:primary', target.prototype) ||
//       (params.primary ? { name: params.primary } : undefined);
//     const prop = Reflect.getMetadata('sqlite:prop', target.prototype);
//     const unique = params.unique
//       ? params.unique.map((u) => {
//           return Array.isArray(u)
//             ? {
//                 name: u.join('_') + '_idx',
//                 keys: u,
//               }
//             : u;
//         })
//       : undefined;
//     const index = params.index
//       ? params.index.map((u) => {
//           return Array.isArray(u)
//             ? {
//                 name: u.join('_') + '_idx',
//                 keys: u,
//               }
//             : u;
//         })
//       : undefined;

//     const __meta: ISqliteMeta<T> = {
//       name,
//       primary,
//       prop,
//       unique,
//       index,
//       createdAt,
//       updatedAt,
//       withoutRowID: params.withoutRowID || false,
//     };

//     target.prototype.__meta = __meta;
//   };
// }

function toSnakeCase(str: string) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
