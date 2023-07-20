import {
  getAvailableBucket,
  getBucketByName,
  getDriverByBucket,
} from '../lib/bucket';
import { getFileMeta } from '../lib/helper';
import {
  File,
  FileObject,
  FileObjectSchema,
  Photo,
  Task,
  TaskModel,
  TaskSchema,
} from '../models';
import { getDriver, md5 } from '@egos/storage';
import fs from 'fs';
import {
  DownloadPayload,
  JobOptions,
  UploadPayload,
  WriteFileParams,
} from './interfaces';
import { IpcMainEvent, ipcMain } from 'electron';
import uuid from 'bson-objectid';
import Driver from '@egos/storage/dist/abstract';
import { getTaskPassword } from './helper';
import Locker from 'await-lock';
import { BucketItem } from '@/config';

export abstract class FileJob {
  protected channel: string;
  protected action: string;
  protected locker: Locker;
  protected type = 'file';
  protected syncJob: any;
  protected options: JobOptions;

  constructor(options: JobOptions) {
    this.options = options;
    this.channel = options.channel;
    this.action = options.action;
    this.locker = new Locker();
  }

  async getTasks(): Promise<TaskModel[]> {
    const where = {
      $and: [
        {
          type: 'file',
        },
        { action: this.action },
        { status: 'pending' },
        // {
        //   status: 'processing',
        //   updatedAt: { $lt: new Date(Date.now() - 3600000).toISOString() },
        // },
      ],
    };
    const tasks = await Task.find(where, { limit: 50 });
    return tasks.filter((t) => {
      return t.retry < t.maxRetry;
    });
  }

  watch() {
    ipcMain.on(`${this.channel}:start`, (event: IpcMainEvent) => {
      this.run(event)
        .then(() => {
          event.reply(this.channel, {
            status: 'done',
            type: this.type,
            action: this.action,
            level: 'job',
            message: 'upload job done',
          });
        })
        .catch((err: Error) => {
          event.reply(this.channel, {
            status: 'error',
            level: 'job',
            type: this.type,
            action: this.action,
          });
        });
    });
    ipcMain.on(`${this.channel}:resume`, (event, { taskIds = [] }) => {
      this.run(event, { id: { $in: taskIds }, status: 'pause' }).catch(
        (err: Error) => {
          event.reply(this.channel, {
            status: 'error',
            level: 'job',
            type: this.type,
            action: this.action,
            message: err.message,
          });
        },
      );
    });
    ipcMain.on(`${this.channel}:pause`, (ev, payload) => {
      this.pause(ev, payload);
    });
  }

  async getSourceInfo(fileId: number) {
    const model = this.type === 'file' ? File : Photo;
    const file = await model.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }
    if (file.status === 'done') {
      const fileObj = await FileObject.findById(file.objectId);
      if (!fileObj) {
        throw new Error('File object not found');
      }
      const bucket = getBucketByName(fileObj.bucket);
      const driver = getDriver(bucket);
      const source = driver.getPath(fileObj.remote);
      return {
        source,
        meta: {
          filename: fileObj.filename,
          type: fileObj.type,
          mime: fileObj.mime,
          ext: fileObj.ext,
          size: fileObj.size,
          mtime: fileObj.mtime,
        },
      };
    }
    if (!fs.existsSync(file.url)) {
      throw new Error('file not exists');
    }
    const meta = await getFileMeta(file.url);
    return { source: file.url, meta };
  }

  async buildPayload(
    task: TaskSchema,
  ): Promise<UploadPayload | DownloadPayload | undefined> {
    const payload = {
      password: '',
      local: '',
      fileId: task.sourceId,
      taskId: task.id,
      name: '',
      action: task.action,
    } as UploadPayload;
    const password = getTaskPassword(task.id as number);
    if (task.action === 'encrypt') {
      if (!password) {
        return;
      }
      payload.password = md5(password);
    }
    const fileId = task.sourceId;
    const model = this.type === 'file' ? File : Photo;
    const file = await model.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }
    if (task.action === 'encrypt' && file.isEncrypt) {
      return;
    }
    if (file.status === 'done') {
      const fileObj = await FileObject.findById(file.objectId);
      if (!fileObj) {
        throw new Error('Fileobject not found');
      }
      const driver = getDriverByBucket(fileObj.bucket) as Driver;
      payload.local = driver.getPath(fileObj.remote);
      const ext = '.egos';
      const name =
        task.action === 'encrypt'
          ? fileObj.remote + ext
          : fileObj.remote.replace(ext, '');
      payload.name = name;
    } else {
      payload.name = '';
      payload.local = file.url;
    }

    return payload;
  }

  progress(event: IpcMainEvent, file: any, taskId: string) {
    return async (checkpoint: any) => {
      const { size, cursor, lastPoint, interval } = checkpoint;
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
        type: this.type,
        action: this.action,
        status: 'uploading',
        payload: task.payload,
        taskId,
        size,
        percent: cursor / size,
        speed: (cursor - lastPoint) / interval,
      });
    };
  }

  async write(event: IpcMainEvent, payload: WriteFileParams) {
    const { bucket, source, dest, taskId, password, action } = payload;
    const driver = getDriverByBucket(bucket);
    const isEncrypt = action === 'encrypt';
    const isDecrypt = action === 'decrypt';
    const res = await driver.multipartUpload(source, dest, {
      ...payload,
      isEncrypt,
      isDecrypt,
      taskId,
      secret: password,
      onProgress: this.progress(event, source, taskId as string),
      onFinish: async () => {
        const task = await Task.findById(taskId);
        event.reply(this.channel, {
          taskId,
          status: 'finish',
          action: this.action,
          type: this.type,
          level: 'task',
          payload: task?.payload,
        });
      },
    });
    return res;
  }

  async addFile(event: IpcMainEvent, payload: Omit<UploadPayload, 'parentId'>) {
    const { name } = payload;
    const bucket = getAvailableBucket(this.type);
    const driver = getDriver(bucket);
    const { source, meta } = await this.getSourceInfo(payload.fileId as number);
    const remote = name || uuid().toHexString() + '.' + meta.ext || 'unknow';
    const dest = driver.getPath(remote);
    const writeParams = {
      source,
      dest,
      taskId: payload.taskId,
      bucket: bucket.name,
      password: payload.password,
      action: payload.action,
    };
    const res = await this.write(event, writeParams);
    const data: Record<string, any> = {
      ...meta,
      remote,
      md5: res,
      bucket: bucket.name,
    };

    return FileObject.create(data);
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
        : getAvailableBucket(this.type);
      const driver = getDriver(bucket);
      driver.cancel(task.id, async () => {
        await Task.update({ id: task.id }, { status: 'pause' });
        event.reply(this.channel, {
          taskId: task.id,
          status: 'pause',
          type: 'task',
          action: this.action,
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
        : getAvailableBucket(this.type);
      const driver = getDriver(bucket);
      driver.cancel(task.id, async () => {
        await driver.clearFragment(payload.remote, type);
        await Task.deleteById(task.id);
        event.reply(this.channel, {
          taskId: task.id,
          status: 'cancel',
          type: 'job',
          action: this.action,
          message: 'job cancelled',
          err: null,
        });
      });
    }
  }
  async success(event: IpcMainEvent, payload: any, result?: any) {
    if (this.channel) {
      event.reply(this.channel, {
        status: 'success',
        message: 'success',
        type: this.type,
        action: this.action,
        ...payload,
        result,
      });
    }
    const fileObj = await FileObject.findByIdOrError(payload.objectId);
    const bucket = getBucketByName(fileObj.bucket) as BucketItem;
    if (Array.isArray(fileObj.backup)) {
      Object.entries(fileObj.backup).map(([toBucket]) => {
        this.syncJob.add({
          fromBucket: bucket.name,
          toBucket,
          objectId: fileObj.id,
        });
      });
      this.syncJob.start();
    }
  }

  failure(event: IpcMainEvent, payload: any, err: any) {
    if (this.channel) {
      event.reply(this.channel, {
        message: payload.message || 'failure',
        status: 'failure',
        type: 'task',
        action: this.action,
        payload,
        err,
      });
    }
  }

  async onFailure(event: IpcMainEvent, taskId: number, err: Error) {
    const task = await Task.findById(taskId);
    if (!task) {
      return;
    }

    if (task.retry <= task.maxRetry) {
      await task.updateAttributes({
        status: 'unresolved',
        err: err.message,
        retry: task.retry + 1,
      });
      this.failure(event, task.toJSON(), err.message);
    } else {
      throw err;
    }
  }

  async process(
    event: IpcMainEvent,
    payload: Record<string, any>,
  ): Promise<any> {}

  async run(event: IpcMainEvent, options?: any): Promise<any> {
    try {
      await this.locker.acquireAsync();
      // make sure only one task in running
      const tasks = await this.getTasks();
      for (const task of tasks) {
        const payload = await this.buildPayload(task.toJSON() as TaskSchema);
        if (!payload) {
          continue;
        }
        await task.updateAttributes({ status: 'processing' });
        event.reply(this.channel, {
          taskId: task.id,
          type: this.type,
          action: this.action,
          status: 'processing',
          retry: task.retry,
          payload: task.payload,
          level: 'task',
        });
        await this.process(event, { ...payload })
          .then(async (fileObj: FileObjectSchema) => {
            await Task.update({ id: task.id }, { status: 'done' });
            this.success(event, {
              ...payload,
              payload: task.payload,
              taskId: task.id,
              targetId: task.sourceId,
              objectId: fileObj.id,
            });
          })
          .catch(async (err: Error) => {
            if (task.retry > task.maxRetry) {
              task.status = 'unresolved';
              task.err = err.message;
              task.retry += 1;
              await task.updateAttributes({
                status: 'unresolved',
                err: err.message,
                retry: task.retry + 1,
              });
            } else {
              this.failure(
                event,
                {
                  type: 'task',
                  payload,
                },
                err.message,
              );
              throw err;
            }
          });
      }
    } catch (err) {
      console.log('upload error', err);
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
}
