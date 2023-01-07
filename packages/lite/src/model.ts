import Debug from 'debug';
import { Builder } from './builder';
import { Dict, ModelOpts } from './interface';
import { isEmpty, pick, has, equals } from 'ramda';
import { Database, ISqlite } from 'sqlite';
import { TimestampSchema, ColumnSchema } from './schema';
import { column } from './decorators';

const debug = Debug('@egos/lite:model');
export class Model {
  private db: Database;
  public table: string;
  private _pk: string[];
  readonly _options: any;
  private _attributes: Dict;
  private _connected: boolean;
  [key: string]: any;
  constructor(options?: ModelOpts) {
    this._attributes = {};
    this._pk = [];
    this._options = options;
    this._connected = false;
    this.initialize();
  }

  get schema() {
    return Reflect.getMetadata('model:schema', this);
  }

  get indices() {
    return Reflect.getMetadata('model:indices', this);
  }

  initialize(): Model {
    const schema = this.schema;
    for (const key in schema) {
      if (schema[key].pk) {
        this._pk.push(key);
      }
    }
    if (this._options?.timestamp) {
      Reflect.defineMetadata(
        'model:schema',
        { ...schema, ...TimestampSchema },
        this,
      );
    }
    return this;
  }

  async connect() {
    if (!this._connected) {
      this.db = await Promise.resolve(this.db);
      this._connected = true;
    }
    return this.db;
  }

  getColumn(field: string): ColumnSchema | undefined {
    return this.schema[field];
  }

  encode<T>(filed: string, value: T): T {
    if (value === undefined) {
      return this.schema[filed]?.default;
    }
    const column = this.getColumn(filed);
    if (column?.encode) {
      return column.encode(value);
    }
    return value;
  }

  decode<T>(filed: string, value: T): T {
    if (value === undefined) {
      return value;
    }
    const column = this.getColumn(filed);
    if (column?.decode) {
      return column.decode(value);
    }
    return value;
  }

  getAttrs(): Dict {
    const schema = this.schema;
    const data: Record<string, any> = {};
    Object.keys(schema).forEach((k: string) => {
      data[k] = this[k];
    });
    return { ...this._attributes, ...data };
  }

  getAttr(name: string): any {
    const data = this.getAttrs();
    return this.decode(name, data[name]);
  }

  setAttr(name: string, value: any): void {
    const schema = this.schema;
    if (name in schema) {
      this[name] = value;
      this._attributes[name] = value;
    }
  }

  purify(data: Dict): Dict {
    const res: Dict = {};
    for (const key in data) {
      res[key] = this.encode(key, data[key]);
    }
    return res;
  }

  clone(): Model {
    return new (this.constructor as new () => this)();
  }

  instance(data: Dict): Model {
    const instance = this.clone();
    for (const key in data) {
      const column = this.schema[key];
      const val = column?.decode ? column.decode(data[key]) : data[key];
      instance.setAttr(key, val);
    }

    return instance;
  }

  toObject(): Dict {
    return this.getAttrs();
  }

  toJSON(): Dict {
    return this.toObject();
  }

  async exec(sql: string): Promise<void> {
    await this.connect();
    return this.db.exec(sql);
  }

  async call(
    method: string,
    sql: string,
    params: Record<string, any>,
  ): Promise<any> {
    await this.connect();
    if (this._options?.debug) {
      debug('[sql]: %s, [params]: %j', sql, params);
    }
    const stmt = await this.db.prepare(sql);
    return stmt[method](params);
  }

  async find(where: Dict, options: Dict = {}): Promise<Model[]> {
    const { limit, offset, order, fields, group } = options;
    const builder = new Builder({});
    const { sql, params } = builder
      .table(this.table)
      .where(where)
      .fields(fields)
      .order(order)
      .group(group)
      .limit(limit)
      .offset(offset)
      .select();
    const res = await this.call('all', sql, params);
    if (options.rows) {
      return res;
    }
    return res.map((item: Record<string, any>) => {
      return this.instance(item);
    });
  }

  async count(where: Dict): Promise<number> {
    const res = await this.findOne(where, { fields: ['count(*) as count'] });
    return Number(res.count);
  }

  async findOne(where: Dict, options: Dict = {}): Promise<Model | null> {
    options.limit = 1;
    const res = await this.find(where, options);
    if (res.length) {
      return res[0];
    }
    return null;
  }

  findAll(where: Dict, options: Dict = {}): Promise<Model[]> {
    return this.find(where, options);
  }

  findById(id: number | string): Promise<Model | null> {
    return this.findOne({ id });
  }

  findByIds(ids: number[]): Promise<Model[]> {
    return this.find({ id: { $in: ids } });
  }

  defaultData(): Dict {
    const payload: Dict = {};
    Object.entries(this.schema).map(
      ([k, col]: [k: string, col: ColumnSchema]) => {
        const def = col.default;
        if (typeof def === 'undefined') {
          return;
        }
        payload[k] = typeof def === 'function' ? def() : def;
      },
    );
    return payload;
  }

  async onChange(changed: Dict): Promise<void> {
    for (const k in changed) {
      const col: ColumnSchema = this.schema[k];
      if (!col) {
        continue;
      }
      if (!col.onChange) {
        continue;
      }
      const v = await Promise.resolve(col.onChange.call(this, changed[k]));
    }
  }

  async create(data: Dict): Promise<Model> {
    return this.insert(data);
  }

  async insert(payload: Dict): Promise<Model> {
    const builder = new Builder({});
    const data = this.purify(payload);
    const defaultData = this.defaultData();
    const { sql, params } = builder
      .table(this.table)
      .insert({ ...data, ...defaultData });
    const { lastID } = await this.call('run', sql, params);
    if (this._options?.onInsert) {
      await Promise.resolve(this._options.onInsert);
    }
    return this.findById(lastID);
  }

  async update(where: Dict, payload: Dict): Promise<ISqlite.RunResult> {
    const builder = new Builder({});
    const data = this.purify(payload);
    const changed = this.getChange();
    const { sql, params } = builder
      .table(this.table)
      .where(where)
      .update({ ...changed, ...data });
    const res = await this.call('run', sql, params);
    await this.onChange(changed);
    return res;
  }

  updateAttributes(payload: Dict): Promise<Model> {
    if (!this._pk) {
      throw new Error('updateAttributes must be called on instance');
    }
    const current = this._attributes;
    Object.entries(payload).map((item) => {
      const [key, value] = item;
      if (has(key, current)) {
        this[key] = value;
      }
    });

    return this.save();
  }

  async upsert(data: Dict): Promise<Model> {
    if (data.id) {
      const record = await this.findById(data.id);
      if (record) {
        return record.updateAttributes(data);
      }
    }

    return this.insert(data);
  }

  getChange() {
    return Object.entries(this._attributes).reduce((acc: Dict, cur: any[]) => {
      const [k, v] = cur;
      if (this[k] !== v) {
        acc[k] = this[k];
      }
      return acc;
    }, {});
  }

  async save(): Promise<Model> {
    const pk = pick(this._pk, this.getAttrs());
    if (!this._pk || isEmpty(pk)) {
      throw new Error('save must be called on instance');
    }
    const changed = this.getChange();
    if (!Object.keys(changed).length) {
      return this;
    }
    await this.update(pk, changed);
    return this.findOne(pk);
  }

  async remove(): Promise<ISqlite.RunResult> {
    const pk = pick(this._pk, this._attributes);
    if (!this._pk || isEmpty(pk)) {
      throw new Error('save must be called on instance');
    }

    const res = await this.delete(pk);
    if (this._options?.onRemove) {
      await Promise.resolve(this._options.onRemove);
    }
    return res;
  }

  async deleteById(id: number): Promise<boolean> {
    const record = this.findById(id);
    if (!record) {
      return false;
    }
    const builder = new Builder({});
    const { sql, params } = builder.table(this.table).where({ id }).delete();
    await this.call('run', sql, params);
    return true;
  }

  async delete(where: Dict): Promise<ISqlite.RunResult> {
    const builder = new Builder({});
    const { sql, params } = builder.table(this.table).where(where).delete();
    return await this.call('run', sql, params);
  }
}
