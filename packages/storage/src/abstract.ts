import Ajv from 'ajv';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import util from 'util';
import { Readable } from 'stream';
import { BucketItem, ChunkProps, FileObject, FlightItem } from './interface';
import { ServiceError } from './error';

export default abstract class Driver {
  static buckets = [];
  static _schema: any;
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
    return (this.constructor as any)._schema;
  }

  cancel(taskId: number, cb: () => any) {
    const index = this._cancel.indexOf(taskId);
    if (index === -1) {
      this._cancel.push(taskId);
    }
    this._event.on('cancel', cb);
  }

  isCancel(taskId: number) {
    if (!taskId) {
      return false;
    }
    return this._cancel.includes(taskId);
  }

  afterCancel(taskId: number) {
    const index = this._cancel.indexOf(taskId);
    if (index !== -1) {
      this._cancel.splice(index, 1);
    }
    this._event.emit('cancel');
  }

  getBucket() {
    return this.bucket;
  }

  getPath(dest: string) {
    const bucket = this.bucket;
    if (!bucket || !bucket.config) {
      throw new ServiceError({
        message: 'Invalid bucket',
      });
    }
    const p = path.join(
      bucket.config.path || '',
      bucket.config.prefix || '',
      dest,
    );
    return p;
  }

  validate(data: any) {
    const schema = this.schema;
    const validate = new Ajv({ strict: false } as Ajv.Options).compile(schema);
    const res = validate(data);
    if (!res) {
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

  async multipartUpload(...args: any[]): Promise<string | boolean> {
    return false;
  }

  async getDoneParts(dest: string, type: string) {
    const filename = this.getLocalChunkFilename(dest, type);
    // const filename = await this.getCacheFilePath(filename);
    if (!fs.existsSync(filename)) {
      return { cursor: 0 };
    }
    const content = await fs.promises.readFile(filename, {
      encoding: 'utf-8',
    });
    return JSON.parse(content);
  }

  async doneChunk({ dest, type, cursor }: ChunkProps) {
    const file = this.getLocalChunkFilename(dest, type);
    console.log('doneChunk', file);
    await fs.promises.writeFile(file, JSON.stringify({ cursor }));
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

  getInflightIdx(taskId: number) {
    const idx = this._inflight.findIndex(
      (item: FlightItem) => item.taskId === taskId,
    );
    return idx;
  }

  getInFlightTask(taskId: number) {
    const idx = this.getInflightIdx(taskId);
    if (idx === -1) {
      return null;
    }
    return this._inflight[idx];
  }

  isInflight(taskId: number) {
    const idx = this.getInflightIdx(taskId);
    if (idx === -1) {
      return false;
    }
    const item = this._inflight[idx];
    if (!item) {
      return false;
    }
    if (item.timestamp < Date.now() - 5000) {
      this._inflight = this._inflight.splice(idx, 1);
      return false;
    }
    return true;
  }

  async freeTask(taskId: number, source?: fs.promises.FileHandle | Readable) {
    const idx = this.getInflightIdx(taskId);
    this._inflight = this._inflight.splice(idx, 1);
    if (source instanceof Readable) {
      source.destroy();
    } else {
      source?.close();
    }
  }

  inflight(taskId: number) {
    const task = this.getInFlightTask(taskId);
    if (!task) {
      this._inflight.push({ taskId, timestamp: Date.now() });
      return false;
    }
    if (task.timestamp < Date.now() - 10000) {
      this.freeTask(taskId);
    }
    return true;
  }

  refreshInflightTask(taskId: number) {
    const idx = this.getInflightIdx(taskId);
    if (idx === -1) {
      return;
    }
    const current = this._inflight[idx];
    const taskState = {
      ...current,
      timestamp: Date.now(),
    };
    this._inflight[idx] = taskState;
  }

  onFinish(taskId: number) {
    this._inflight = this._inflight.filter((t) => t !== taskId);
  }
}
