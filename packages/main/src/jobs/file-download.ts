import Locker from 'await-lock';
import { getDriver } from '@egos/storage';
import fs, { promises as fsp } from 'fs';
import path from 'path';
import uuid from 'bson-objectid';
import { promisify } from 'util';
import { getAvailableBucket, getBucketByName } from '../lib/bucket';
import { getFileMeta } from '../lib/helper';
import { File, FileModel } from '../models/file';
import { FileObject, FileObjectModel } from '../models/file-object';
import { Task, TaskModel } from '../models/task';
import { SynchronizeJob } from './synchronize';
import { ipcMain, IpcMainEvent } from 'electron';
import {
  FILE_DOWANLOAD_START,
  // FILE_UPLOAD_CANCEL,
  FILE_UPLOAD_PAUSE,
  FILE_UPLOAD_RESUME,
} from '../event/constant';
import { getTaskSecret } from './helper';
import { ServiceError } from '../error';

export interface DownloadPayload {
  savePath: string;
  name: string;
  taskId: string | number;
  bucket?: { name: string };
  fileId: number;
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
export class FileDownloadJob {
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
    ipcMain.on(FILE_DOWANLOAD_START, (event: IpcMainEvent) => {
      event.reply(this.channel, { message: 'download job started' });
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
      await this.locker.acquireAsync();
      const where = { action: 'download', type: 'file', ...options };
      const tasks = await Task.dequeue({
        where,
        limit: 50,
        retry: 100,
      });
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
        if (payload.isEncrypt) {
          const secret = getTaskSecret(task.id);
          if (!secret) {
            continue;
          }
        }
        await task.updateAttributes({ status: 'processing' });
        event.reply(this.channel, {
          taskId: task.id,
          type: 'download',
          status: 'processing',
          retry: task.retry,
        });
        await this.download(event, {
          ...payload,
          taskId: task.id,
        } as DownloadPayload)
          .then(async () => {
            await Task.update({ id: task.id }, { status: 'done' });
          })
          .catch(async (err) => {
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
      this.locker.release();
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
      // @todo
      driver.cancel(task.id, async () => {
        await Task.update({ id: task.id }, { status: 'pause' });
        event.reply(this.channel, {
          taskId: task.id,
          status: 'pause',
          type: 'download',
          scopen: 'job',
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
          type: 'download',
          scope: 'job',
          message: 'job cancelled',
          err: null,
        });
      });
    }
  }

  async process(event: IpcMainEvent, payload: DownloadPayload) {
    const { savePath, fileId, name, taskId } = payload;
    if (!fs.existsSync(savePath)) {
      return false;
    }
    const fileItem = await File.findById(fileId);
    if (!fileItem) {
      return false;
    }
    if (fileItem.isDiectory) {
      const curDir = path.join(savePath, fileItem.filename);
      await fsp.mkdir(curDir);
      let offset = 0;
      const limit = 10;
      while (true) {
        const fileItems = await File.find(
          { parentId: fileItem.id },
          { offset, limit },
        );
        offset += limit;
        await Promise.all(
          fileItems.map((item) =>
            this.process(event, {
              ...payload,
              fileId: item.id,
              savePath: curDir,
            }),
          ),
        );
        if (fileItems.length < limit) {
          break;
        }
      }
    }
    const fileObj = await FileObject.findById(fileId);
    if (!fileObj) {
      return false;
    }
    await this.download(event, payload);
  }

  async download(
    event: IpcMainEvent,
    payload: Omit<DownloadPayload, 'parentId'>,
  ) {
    const { name } = payload;
    const bucket = getAvailableBucket('file');
    const driver = getDriver(bucket);
    const { source } = await this.getSourceInfo({ fileId: payload.fileId });
    const remote = name || uuid().toHexString();
    const dest = driver.getPath(remote);
    return dest;
  }

  async getSourceInfo(payload: { local?: string; fileId?: number }) {
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
        scope: 'task',
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
