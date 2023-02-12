import { Remote } from '@/lib/remote';

export default class BaseService {
  _table = '';
  _api: any;
  _model: any;
  constructor(table: string) {
    this._table = table;
    this._api = Remote.Api;
    this.init();
  }

  get model() {
    return this._model;
  }

  set model(model: any) {
    this._model = model;
  }

  init() {
    this.model = this._api.getModel(this._table);
  }

  async exec(method: string, ...payload: any) {
    const res = await this.model.execute({
      url: this._table,
      method,
      args: payload,
    });
    return res;
  }

  find(where: any, options = {}) {
    return this.exec('find', where, options);
  }

  count(where: any) {
    return this.exec('count', where);
  }

  findOne(where: any, options = {}) {
    return this.exec('findOne', where, options);
  }

  findAll(where: any, options: any) {
    return this.exec('findAll', where, options);
  }

  findById(id: string | number) {
    return this.exec('findById', id);
  }

  findByIds(ids: string[] | number[]) {
    return this.exec('findByIds', ids);
  }

  create(data: Record<string, any>) {
    return this.exec('create', data);
  }

  insert(data: Record<string, any>) {
    return this.exec('insert', data);
  }

  update(where: any, data: Record<string, any>) {
    return this.exec('update', where, data);
  }

  async upsert(data: Record<string, any>) {
    return this.exec('upsert', data);
  }

  save() {}

  remove() {}

  async deleteById(id: number | string) {
    return this.exec('deleteById', id);
  }

  delete(where: any) {
    return this.exec('delete', where);
  }
}
