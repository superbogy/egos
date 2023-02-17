import { ServiceError } from '../error';
import { column, table } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';
import { File } from './file';
import fs from 'fs';
import { jsonParser, jsonStringify } from '../lib/helper';

export enum QueueStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  CANCELED = 'canceled',
  UNRESOLVED = 'unresolved',
  DONE = 'done',
}

@table('tasks')
class TaskModel extends Base {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: string;
  @column({ type: FieldTypes.TEXT })
  action: string;
  @column({ type: FieldTypes.TEXT })
  type: string;
  @column({ type: FieldTypes.TEXT })
  status: string;
  @column({ type: FieldTypes.TEXT, decode: jsonParser, encode: jsonStringify })
  payload: string;
  @column({ type: FieldTypes.INT, default: 0 })
  retry: number;
  @column({ type: FieldTypes.INT, default: 3 })
  maxRetry: number;
  @column({ type: FieldTypes.INT, default: '' })
  targetId: number;
  @column({ type: FieldTypes.TEXT, default: '' })
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
  }: {
    files: string[];
    parentId: number;
  }) {
    for (const file of files) {
      await this.uploadJob(file, parentId);
    }
  }

  async uploadJob(file: string, parentId: number) {
    try {
      const parent = await File.findById(parentId);
      if (!parent) {
        throw new ServiceError({
          message: 'Upload folder not found1',
        });
      }
      const stat = fs.statSync(file);
      const task = {
        action: 'upload',
        type: 'file',
        payload: { local: file, size: stat.size, parentId },
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
}

export const Task = new TaskModel();