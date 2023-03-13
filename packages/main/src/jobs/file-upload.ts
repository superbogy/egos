import Locker from 'await-lock';
import { getDriver } from '@egos/storage';
import fs, { promises as sfp } from 'fs';
import path from 'path';
import uuid from 'bson-objectid';
import { promisify } from 'util';
import { getAvailableBucket, getBucketByName } from '../lib/bucket';
import { getFileMeta } from '../lib/helper';
import { File, FileModel } from '../models/file';
import { FileObject } from '../models/file-object';
import { Task } from '../models/task';
import { SynchronizeJob } from './synchronize';
import { ipcMain, IpcMainEvent } from 'electron';
import {
  // FILE_UPLOAD_CANCEL,
  FILE_UPLOAD_PAUSE,
  FILE_UPLOAD_RESUME,
  FILE_UPLOAD_START,
} from '../event/constant';
import { getTaskSecret } from './helper';
import { ServiceError } from '../error';

export interface UploadPayload {
  local: string;
  parentId: number;
  name: string;
  taskId: string | number;
  bucket?: { name: string };
  fileId?: number;
}

export interface CheckPoint {
  size: number;
  total: number;
  partNumber: number;
  taskId: number | string;
  percent: number;
}

export interface JobOptions {
  channel: string;
  [key: string]: any;
}
export class FileUploadJob {
  static locker = new Locker();
  private readonly options: JobOptions;
  private locker: Locker;
  private syncJob: any;
  protected channel: string;
  constructor(options: JobOptions) {
    this.options = options;
    this.locker = new Locker();
    this.syncJob = new SynchronizeJob();
    this.channel = options.channel;
  }

  watch() {
    ipcMain.on(FILE_UPLOAD_START, (event: IpcMainEvent) => {
      event.reply(this.channel, { message: 'upload job started' });
      this.run(event)
        .then(() => {
          event.reply(this.channel, {
            status: 'done',
            type: 'job',
            message: 'upload job done',
          });
        })
        .catch((err: Error) => {
          event.reply(this.channel, {
            status: 'error',
            type: 'job',
            message: err.message,
          });
        });
    });
    ipcMain.on(FILE_UPLOAD_RESUME, (event, { taskIds = [] }) => {
      this.run(event, { id: { $in: taskIds }, status: 'pause' }).catch(
        (err: Error) => {
          event.reply(this.channel, {
            status: 'failure',
            type: 'job',
            message: err.message,
          });
        },
      );
    });
    ipcMain.on(FILE_UPLOAD_PAUSE, (ev, payload) => {
      this.pause(ev, payload);
    });
  }

  async run(event: IpcMainEvent, options?: any): Promise<any> {
    try {
      await FileUploadJob.locker.acquireAsync();
      const where = { action: 'upload', type: 'file', ...options };
      const tasks = await Task.dequeue({ where, limit: 50, retry: 100 });
      if (!tasks.length) {
        return;
      }
      for (const task of tasks) {
        if (task.retry >= task.maxRetry) {
          continue;
        }
        const { payload } = task;
        if (!payload) {
          continue;
        }
        const secret = getTaskSecret(task.id);
        if (!secret && payload.isEncrypt) {
          continue;
        }
        await task.updateAttributes({ status: 'processing' });
        console.log('task iiiiiddddd', task.id, task);
        event.reply(this.channel, {
          taskId: task.id,
          type: 'upload',
          status: 'processing',
          retry: task.retry,
        });
        const q = payload.isEncrypt
          ? this.addFile(event, { ...payload, taskId: task.id })
          : this.upload(event, { ...payload, taskId: task.id });
        await q
          .then(async () => {
            await Task.update({ id: task.id }, { status: 'done' });
          })
          .catch(async (err) => {
            console.log('fuck err', err);
            if (task.retry > task.maxRetry) {
              task.status = 'unresolved';
              task.err = err.message;
              task.retry += 1;
              await task.updateAttributes({
                status: 'unresolved',
                err: err.message,
                retry: task.retry + 1,
              });
              this.failure(event, payload, err.message);
            } else {
              throw err;
            }
          });
      }
    } catch (err) {
      console.log(err);
      this.failure(
        event,
        {
          type: 'job',
          message: 'exception error',
        },
        err,
      );
    } finally {
      FileUploadJob.locker.release();
    }
  }

  async pause(event: IpcMainEvent, { taskIds }: { taskIds: number[] }) {
    const tasks = await Task.findByIds(taskIds);
    if (!tasks.length) {
      return;
    }
    for (const task of tasks) {
      const payload = task.payload;
      const bucket = payload.bucket
        ? getBucketByName(payload.bucket)
        : getAvailableBucket(payload.bucketType);
      const driver = getDriver(bucket);
      driver.cancel(task.id, async () => {
        await Task.update({ id: task.id }, { status: 'pause' });
        event.reply(this.channel, {
          taskId: task.id,
          status: 'pause',
          type: 'job',
          message: 'ok',
          err: null,
        });
      });
    }
  }
  async cancel(
    event: IpcMainEvent,
    { taskIds, type }: { taskIds: number[]; type: string },
  ) {
    const tasks = await Task.findByIds(taskIds);
    if (!tasks.length) {
      return;
    }
    for (const task of tasks) {
      const payload = task.payload;
      const bucket = payload.bucket
        ? getBucketByName(payload.bucket)
        : getAvailableBucket(payload.bucketType);
      const driver = getDriver(bucket);
      driver.cancel(task.id, async () => {
        await driver.clearFragment(payload.remote, type);
        await Task.deleteById(task.id);
        event.reply(this.channel, {
          taskId: task.id,
          status: 'cancel',
          type: 'job',
          message: 'job cancelled',
          err: null,
        });
      });
    }
  }

  async upload(event: IpcMainEvent, payload: UploadPayload) {
    const bucket = getAvailableBucket('file');
    const { local, parentId, name, taskId } = payload;
    if (!local) {
      return false;
    }
    const filepath = ['/'];
    if (parentId) {
      const parent = (await File.findById(parentId)) as FileModel;
      filepath.push(parent.path);
    }
    const stat = await promisify(fs.stat)(local);
    if (stat.isDirectory()) {
      const folderName = path.basename(local);
      const folder = {
        parentId: parentId || 0,
        filename: folderName,
        path: path.join(...filepath, folderName),
        size: 0,
        type: 'folder',
        isFolder: 1,
        fileId: 0,
        description: '',
        bucket: bucket.name,
      };
      let current = await File.findOne({ path: folder.path });
      if (!current) {
        current = await File.create(folder);
      }
      const files = await sfp.readdir(local);
      for (const item of files) {
        await this.upload(event, {
          local: path.join(local, item),
          parentId: current.id,
          name,
          taskId,
        });
      }
      return current.toJSON();
    } else {
      const fileObj = await this.addFile(event, {
        local,
        name,
        taskId,
      });
      console.log('ffffile object', fileObj);
      if (!fileObj) {
        return null;
      }
      const filename = fileObj.filename;
      const res = await File.create({
        parentId: parentId || 0,
        filename,
        path: path.join(...filepath, fileObj.filename),
        size: fileObj.size,
        type: fileObj.type,
        isFolder: 0,
        fileId: fileObj.id,
        description: '',
      });
      this.success(event, {
        ...payload,
        taskId: taskId,
        targetId: res.id,
      });
      if (Array.isArray(fileObj.backup)) {
        Object.entries(fileObj.backup).map(([toBucket]) => {
          this.syncJob.add({
            fromBucket: bucket.name,
            toBucket,
            fileId: fileObj.id,
          });
        });
        this.syncJob.start();
      }

      return res.toJSON();
    }
  }

  async addFile(event: IpcMainEvent, payload: Omit<UploadPayload, 'parentId'>) {
    const { name, taskId } = payload;
    const bucket = getAvailableBucket('file');
    const driver = getDriver(bucket);
    const { source, meta } = await this.getSourceInfo(payload);
    const remote = name || uuid().toHexString();
    const dest = driver.getPath(remote);
    console.log('-0--1==>', source, dest);
    const res = await driver.multipartUpload(source, dest, {
      taskId,
      secret: getTaskSecret(taskId as number),
      onProgress: this.progress(event, source),
      onFinish: async () => {
        event.reply(this.channel, {
          taskId,
          status: 'finish',
          type: 'upload',
        });
      },
    });
    console.log('resssss', res);
    if (!res) {
      return null;
    }
    const data = {
      ...meta,
      id: payload.fileId,
      local: '',
      remote,
      md5: res,
      bucket: bucket.name,
    };

    return await FileObject.upsert({ ...data });
  }

  async getSourceInfo(payload: { local?: string; fileId?: number }) {
    console.log('getSourceInfo', payload);
    if (payload.local) {
      if (!fs.existsSync(payload.local)) {
        throw new Error('file not exists');
      }
      const meta = await getFileMeta(payload.local);
      return { source: payload.local, meta };
    }
    if (payload.fileId) {
      const fileObj = (await FileObject.findById(payload.fileId)) as any;
      const bucket = getBucketByName(fileObj.bucket);
      const driver = getDriver(bucket);
      const source = driver.getPath(fileObj.remote);
      return { source, meta: fileObj.toJSON() };
    }
    throw new ServiceError({
      message: 'invalid upload payload',
    });
  }

  progress(event: IpcMainEvent, file: string) {
    return async (checkpoint: any) => {
      const { size, cursor, lastPoint, taskId, interval } = checkpoint;
      const task = await Task.findById(taskId);
      if (!task) {
        return;
      }
      task.checkpoint = checkpoint;
      await task.save();
      if (!event) {
        return;
      }
      event.reply(this.channel, {
        message: 'progress',
        type: 'upload',
        status: 'uploading',
        taskId,
        size,
        percent: cursor / size,
        speed: (cursor - lastPoint) / interval,
        file: file,
      });
    };
  }

  success(event: IpcMainEvent, payload: any, result?: any) {
    if (this.channel) {
      event.reply(this.channel, {
        status: 'success',
        message: 'success',
        type: 'upload',
        payload,
        result,
      });
    }
  }

  failure(event: IpcMainEvent, payload: any, err: any) {
    if (this.channel) {
      event.reply(this.channel, {
        message: payload.message || 'failure',
        status: 'failure',
        type: 'upload',
        payload,
        err,
      });
    }
  }
}
