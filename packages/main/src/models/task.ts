import { ServiceError } from '../error';
import { ORDER_TYPE, column, schema, table } from '@egos/lite';
import { utils } from '@egos/lite';
import crypto from 'crypto';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';
import { File } from './file';
import fs from 'fs';
import path from 'path';
import { getAvailablePath } from '../lib/helper';
import { Photo, PhotoSchema } from './photo';
import dayjs from 'dayjs';

export enum QueueStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  CANCELED = 'canceled',
  UNRESOLVED = 'unresolved',
  DONE = 'done',
}

export class TaskSchema {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.TEXT })
  action: string;
  @column({ type: FieldTypes.TEXT })
  type: string;
  @column({ type: FieldTypes.TEXT })
  status: string;
  @column({
    type: FieldTypes.TEXT,
    decode: utils.jsonParser,
    encode: utils.jsonStringify,
  })
  payload: Record<string, any>;
  @column({ type: FieldTypes.INT, default: 0 })
  retry: number;
  @column({ type: FieldTypes.INT, default: 3 })
  maxRetry: number;
  @column({ type: FieldTypes.INT, default: '' })
  targetId: number;
  @column({ type: FieldTypes.TEXT, default: '' })
  err: string;
  @column({ type: FieldTypes.TEXT, default: '0' })
  sourceId: string;
}

@table('tasks')
@schema(TaskSchema)
export class TaskModel extends Base {
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
      if (!payload.fileId && !payload.local) {
        throw new ServiceError({
          message: 'Invalid upload payload',
        });
      }
      const parent = await File.findById(payload.parentId);
      if (!parent) {
        throw new ServiceError({
          message: 'Upload folder not found',
        });
      }
      let fileId = payload.fileId;
      if (payload.local) {
        const filename = path.basename(payload.local);
        const stat = fs.statSync(payload.local);
        const p = await getAvailablePath(path.join(parent.path, filename));
        const newFile = await File.create({
          parentId: payload.parentId || 0,
          filename,
          path: p,
          size: 0,
          type: stat.isDirectory() ? 'folder' : 'file',
          isFolder: stat.isDirectory() ? 1 : 0,
          local: payload.local,
          objectId: 0,
          description: '',
          password: '',
          status: 'uploading',
        });
        fileId = newFile.id;
      }
      const task = {
        action: 'upload',
        type: 'file',
        status: 'pending',
        retry: 0,
        maxRetry: 10,
        err: '',
        sourceId: fileId,
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
      action: 'encrypt',
      type: 'file',
      status: 'pending',
      retry: 0,
      maxRetry: 10,
      err: '',
      sourceId: file.id,
    };
    await Task.create(task);
    return true;
  }
  async download({ ids, type }: { ids: number[]; type: string }) {
    const model = type === 'image' ? Photo : File;
    const files = await model.findByIds(ids);
    for (const file of files) {
      const task = {
        action: 'download',
        type,
        retry: 0,
        status: 'pending',
        payload: {},
        maxRetry: 10,
        err: '',
        sourceId: file.id,
      };
      await Task.create(task);
    }
  }
  async buildImageUploadTasks(payload: any) {
    const { albumId, files } = payload;
    for (const file of files) {
      const filename = path.basename(file.path);
      const p = await getAvailablePath(file.path);
      const newFile = await File.create({
        parentId: payload.parentId || 0,
        filename,
        path: p,
        size: 0,
        type: 'image',
        isFolder: 0,
        url: file.path,
        objectId: 0,
        description: '',
        password: '',
        status: 'uploading',
      });
      const last = await Photo.findOne(
        { albumId },
        { order: { rank: ORDER_TYPE.DESC } },
      );
      const rank = last ? last.rank + 1 : 1;
      const photo = {
        albumId: albumId || file.albumId,
        rank,
        fileId: newFile.id,
        location: '',
        photoDate: new Date(
          dayjs(file.photoDate).format('YYYY-MM-DD'),
        ).toISOString(),
      };
      console.log(photo, newFile);
      const item = await Photo.create(photo);
      await Task.create({
        action: 'upload',
        type: 'photo',
        retry: 0,
        status: 'pending',
        payload: { uid: file.uid },
        maxRetry: 10,
        err: '',
        sourceId: item.id,
      });
    }
  }
  async buildAlbumDownTask(payload: any) {
    await Task.create({
      action: 'download',
      type: 'photo',
      retry: 0,
      status: 'pending',
      payload: { isAlbum: true },
      maxRetry: 10,
      err: '',
      sourceId: payload.albumId,
    });
  }
}

export const Task = new TaskModel();
