import Ajv from 'ajv';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import util from 'util';
import { BucketItem, ChunkProps, FileObject } from './interface';

export default class Driver {
  static buckets = [];
  protected bucket: BucketItem;
  protected _cancel: any[];
  protected _inflight: any[];
  protected _event: EventEmitter;
  constructor(bucket: BucketItem) {
    this.bucket = bucket;
    this._cancel = [];
    this._inflight = [];
    this._event = new EventEmitter();
  }

  get schema(): any {
    return null;
  }

  cancel(taskId: string, cb: () => any) {
    const index = this._cancel.indexOf(taskId);
    if (index === -1) {
      this._cancel.push(taskId);
    }
    this._event.on('cancel', cb);
  }

  isCancel(taskId: string) {
    if (!taskId) {
      return false;
    }
    return this._cancel.includes(taskId);
  }

  afterCancel(taskId: string) {
    const index = this._cancel.indexOf(taskId);
    if (index !== -1) {
      this._cancel.splice(index, 1);
    }
    this._event.emit('cancel');
  }

  getBucket() {
    return this.bucket;
  }

  validate(data: any) {
    const validate = new Ajv({ strict: false } as Ajv.Options).compile({
      type: 'object',
      properties: this.schema,
    });
    const res = validate(data);
    if (!res) {
      console.log('validate error', validate.errors);
      throw new Error((validate.errors as Ajv.ErrorObject[])[0].message);
    }
    return true;
  }
  async download(remote: string, save: string) {
    throw new Error(
      `download have not been implemented: ${this.constructor.name}`,
    );
  }

  async getFileContent(file: FileObject): Promise<string> {
    throw new Error(
      `getFileContent have not been implemented: ${this.constructor.name}`,
    );
  }

  async addFile(remote: string, dest: string): Promise<any> {
    throw new Error('addFile have not been implemented');
  }

  async replaceFile(remote: string, dest: string): Promise<any> {
    throw new Error('replaceFile have not been implemented');
  }

  async deleteFile(remote: string): Promise<any> {
    throw new Error('deleteFile have not been implemented');
  }

  async exists(remote: string): Promise<boolean> {
    throw new Error('exists have not been implemented');
  }

  getStream(remote: string): Promise<fs.ReadStream> {
    throw new Error('getStream have not been implemented');
  }

  async getUrl(remote: string): Promise<string> {
    throw new Error('getUrl have not been implemented');
  }

  async getCacheFilePath(fileObj: FileObject): Promise<string> {
    throw new Error(
      `getCacheFilePath have not been implemented: ${this.constructor.name}`,
    );
  }

  getLocalChunkFilename(dest: string, type: string) {
    const driverName = this.constructor.name.toLowerCase();
    return path.join([dest, type, driverName, 'multi.parts'].join('-'));
  }

  async getDoneParts(dest: string, type: string) {
    const filename = this.getLocalChunkFilename(dest, type);
    // const filename = await this.getCacheFilePath(filename);
    if (!fs.existsSync(filename)) {
      return [];
    }
    const content = await util.promisify(fs.readFile)(filename);
    return content
      .toString()
      .split('\n')
      .filter((i) => i.trim())
      .map((item) => item.split(','));
  }

  async doneChunk({ dest, type, eTag, size, partNumber }: ChunkProps) {
    const file = this.getLocalChunkFilename(dest, type);
    // const file = await this.getCacheFilePath(name);
    const part = [eTag, size, partNumber].join(',');
    await util.promisify(fs.appendFile)(file, part + '\n');
  }

  async clearLocalChunkFile(dest: string, type: string) {
    const file = this.getLocalChunkFilename(dest, type);
    if (fs.existsSync(file)) {
      await util.promisify(fs.unlink)(file);
    }
  }

  async clearFragment(dest: string, type: string, options?: any) {
    await this.clearLocalChunkFile(dest, type);
  }

  isInflight(taskId: string) {
    return this._inflight.includes(taskId);
  }

  inflight(taskId: string) {
    if (!this.isInflight(taskId)) {
      this._inflight.push(taskId);
      return true;
    }
    return false;
  }

  onFinish(taskId: string) {
    this._inflight = this._inflight.filter((t) => t !== taskId);
  }
}
