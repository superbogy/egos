import { ServiceError } from '../error';
import { column, table } from '@egos/lite';
import crypto from 'crypto';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';
import { File, FileModel } from './file';
import fs from 'fs';
import { jsonParser, jsonStringify } from '../lib/helper';
import { FileObject } from './file-object';

export enum QueueStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  CANCELED = 'canceled',
  UNRESOLVED = 'unresolved',
  DONE = 'done',
}

@table('tasks')
export class TaskModel extends Base {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.TEXT })
  action: string;
  @column({ type: FieldTypes.TEXT })
  type: string;
  @column({ type: FieldTypes.TEXT })
  status: string;
  @column({ type: FieldTypes.TEXT, decode: jsonParser, encode: jsonStringify })
  payload: Record<string, any>;
  @column({ type: FieldTypes.INT, default: 0 })
  retry: number;
  @column({ type: FieldTypes.INT, default: 3 })
  maxRetry: number;
  @column({ type: FieldTypes.INT, default: '""' })
  targetId: number;
  @column({ type: FieldTypes.TEXT, default: '""' })
  err: string;

  enqueue(data: any) {
    return this.insert({ ...data, status: QueueStatus.PENDING });
  }

  dequeue({ where, limit = 50, retry = 100 }: any) {
    const status = [QueueStatus.PENDING, QueueStatus.PROCESSING];
    return this.find(
      { status: { $in: status }, retry: { $lt: retry }, ...where },
      { limit },
    );
  }

  async buildUploadTasks({
    files,
    parentId,
    type = 'file',
  }: {
    files: string[];
    parentId: number;
    type: string;
  }) {
    for (const file of files) {
      await this.uploadJob({ local: file, parentId, type });
    }
  }

  async uploadJob(payload: {
    local?: string;
    parentId: number;
    fileId?: number;
    type: string;
  }) {
    try {
      const { local, fileId, parentId } = payload;
      const parent = await File.findById(parentId);
      if (!parent) {
        throw new ServiceError({
          message: 'Upload folder not found1',
        });
      }
      const file = fileId ? await File.getFilePath(fileId) : local;
      const task = {
        action: 'upload',
        type: 'file',
        payload: { local: file, parentId },
        status: 'pending',
        retry: 0,
        maxRetry: 10,
        err: '',
      };
      const res = await this.insert(task);
      return res;
    } catch (err) {
      throw new ServiceError({ message: String(err.message), code: 10501 });
    }
  }

  async buildEncryptJob(id: number, password: string) {
    const file = await File.findById(id);
    if (!file) {
      return false;
    }
    const hash = crypto.createHash('md5').digest('hex');
    if (file.password !== hash) {
      return false;
    }
    const task = {
      action: 'upload',
      type: 'file',
      payload: { fileId: file.fileId, password },
      status: 'pending',
      retry: 0,
      maxRetry: 10,
      err: '',
    };
    await Task.create(task);
    return true;
  }
  async download({ ids, local }: { ids: number[]; local: string }) {
    const files = await File.findByIds(ids);
    for (const file of files) {
      const task = {
        action: 'download',
        type: 'file',
        payload: {
          fileId: file.id,
          local,
        },
        retry: 0,
        status: 'pending',
        maxRetry: 10,
        err: '',
      };
      await Task.create(task);
    }
  }
}

export const Task = new TaskModel();
