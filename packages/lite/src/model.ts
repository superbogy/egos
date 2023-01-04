import { Builder } from './builder';
import { Dict, Schema, ModelOpts, ColumnSchema } from './interface';
import DB from './db';
import { isEmpty, pick, has } from 'ramda';
import { ISqlite } from 'sqlite';
import { TimestampSchema, PrimarySchema } from './schema';


export class Model {
  private _db: DB;
  protected _table: string;
  protected _schema: Schema = {};
  protected _dbFile: string;
  private _changed: Dict;
  private _pk: string[];
  readonly _options: ModelOpts;
  private _attributes: Dict;
  [key: string]: any;
  constructor(options: ModelOpts) {
    this._attributes = {};
    this._changed = {};
    this._pk = [];
    this._options = options;
    this._connected = false;
    this.initialize(options);
  }

  get db(): DB | null {
    return this._db;
  }



  initialize(config: ModelOpts): void {
    if (this._db) {
      return;
    }
    if (config.schema) {
      this._schema = config.schema;
    } else {
      this._schema = {
        ...TimestampSchema,
        ...PrimarySchema
      }
    }
    if (config.table) {
      this._table = config.table;
    }
    for (const key in this._schema) {
      if (this._schema[key].pk) {
        this._pk.push(key);
      }
    }
    this._db = DB.getInstance({ filename: this._dbFile, debug: this._options.debug, options: this._options.connection as ISqlite.Config });
    return;
  }

  getFieldSchema(field: string): ColumnSchema | undefined {
    return this._schema[field];
  }


  encodeFieldValue<T>(filed: string, value: T): T {
    if (value === undefined) {
      return this._schema[filed]?.default;
    }
    const schema = this.getFieldSchema(filed);
    if (schema) {
      const md = typeof value === schema.type ? 'encode' : 'decode';
      if (schema[md]) {
        return schema[md](value);
      }
    }
    return value;
  }

  getAttrs(): Dict {
    return { ...this._attributes, ...this._changed };
  }

  getAttr(name: string): any {
    const data = this.getAttrs();
    return this.encodeFieldValue(name, data[name]);
  }

  setAttr(name: string, value: any): void {
    if (this._attributes[name] !== value) {
      this._attributes[name] = value;
    }
  }

  purify(data: Dict): Dict {
    const res: Dict = {};
    for (const key in data) {
      res[key] = this.encodeFieldValue(key, data[key]);
    }
    return res;
  }

  change(name: string, value: any): void {
    this._changed[name] = value;
  }

  clone(): Model {
    return new (this.constructor as new (options: ModelOpts) => this)(this._options as ModelOpts)
  }

  instance(data: Dict): Model {
    const instance = this.clone();
    for (const key in data) {
      instance.setAttr(key, data[key]);
      Object.defineProperty(instance, key, {
        set: (value: any) => {
          instance.change(key, value);
        },
        get: () => {
          return instance.getAttr(key);
        }
      });
    }
    return instance;
  }

  toObject(): Dict {
    const attrs = this.getAttrs();
    return this.purify(attrs);
  }

  toJSON(): Dict {
    return this.toObject();
  }

  exec(sql: string): Promise<void> {
    return this.db.exec(sql);
  }


  async find(where: Dict, options: Dict = {}): Promise<Model[]> {
    const { limit, offset, order, fields, group } = options;
    const builder = new Builder({});
    const { sql, params } = builder.table(this._table)
      .where(where)
      .fields(fields)
      .order(order)
      .group(group)
      .limit(limit)
      .offset(offset)
      .select();
    const res = await this.db.call('all', sql, params);
    if (options.rows) {
      return res;
    }
    return res.map((item) => {
      return this.instance(item);
    })
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

  findById(id: bigint | number): Promise<Model | null> {
    return this.findOne({ id });
  }

  findByIds(ids: number[]): Promise<Model[]> {
    return this.find({ id: { '$in': ids } });
  }

  defaultData(): Dict {
    const payload: Dict = {};
    Object.entries(this._schema).map(([k, col]: [k: string, col: ColumnSchema]) => {
      const def = col.default
      if (typeof def === 'undefined') {
        return;
      }
      if (typeof def === 'function') {
        const v = def();
        payload[k] = v;
      } else {
        payload[k] = def;
      }
    });
    return payload;
  }

  async onChange(): Promise<Dict> {
    const payload: Dict = {};
    for (const k in this._schema) {
      const col: ColumnSchema = this._schema[k];
      const onChange = col.onChange;
      if (!onChange) {
        continue;
      }
      const v = await Promise.resolve(onChange.call(this));
      payload[k] = v;
    }
    return payload;
  }

  async create(data: Dict): Promise<Model> {
    return this.insert(data);
  }

  async insert(payload: Dict): Promise<Model> {
    const builder = new Builder({});
    const data = this.purify(payload);
    const defaultData = this.defaultData();
    const { sql, params } = builder.table(this._table).insert({ ...data, ...defaultData });
    const { lastID } = await this.db.call('run', sql, params);
    return this.findById(lastID);
  }

  async update(where: Dict, payload: Dict): Promise<ISqlite.RunResult> {
    const builder = new Builder({});
    const data = this.purify(payload);
    const changed = await this.onChange();
    const { sql, params } = builder.table(this._table)
      .where(where)
      .update({ ...changed, ...data });
    return await this.db.call('run', sql, params);
  }

  updateAttributes(payload: Dict): Promise<Model> {
    if (!this._pk) {
      throw new Error('updateAttributes must be called on instance');
    }
    const current = this._attributes;
    Object.entries(payload).map(item => {
      const [key, value] = item;
      if (has(key, current)) {
        this.change(key, value);
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

  async save(): Promise<Model> {
    const pk = pick(this._pk, this.getAttrs());
    if (!this._pk || isEmpty(pk)) {
      throw new Error('save must be called on instance');
    }
    if (!Object.keys(this._changed).length) {
      return this;
    }
    await this.update(pk, this._changed);
    return this.findOne(pk);
  }


  remove(): Promise<ISqlite.RunResult> {
    const pk = pick(this._pk, this._attributes)
    if (!this._pk || isEmpty(pk)) {
      throw new Error('save must be called on instance');
    }

    return this.delete(pk);
  }

  async deleteById(id: number): Promise<boolean> {
    const record = this.findById(id);
    if (!record) {
      return false;
    }
    const builder = new Builder({});
    const { sql, params } = builder.table(this._table)
      .where({ id })
      .delete();
    await this.db.call('run', sql, params);
    return true;
  }

  async delete(where: Dict): Promise<ISqlite.RunResult> {
    const builder = new Builder({});
    const { sql, params } = builder.table(this._table)
      .where(where)
      .delete();
    return await this.db.call('run', sql, params);
  }
}

