import {
  getAvailableBucket,
  getBucketByName,
  getDriverByBucket,
} from '../lib/bucket';
import { getFileMeta } from '../lib/helper';
import { File, FileObject, Task, TaskModel } from '../models';
import { getDriver, md5 } from '@egos/storage';
import fs from 'fs';
import { ServiceError } from '../error';
import { UploadPayload, WriteFileParams } from './interfaces';
import { IpcMainEvent, ipcMain } from 'electron';
import uuid from 'bson-objectid';
import Driver from '@egos/storage/dist/abstract';
import { getTaskPassword } from './helper';
import path from 'path';

export abstract class FileJob {
  protected channel: string;
  protected action: string;

  async run(event: IpcMainEvent, options?: Record<string, any>) {}

  async getTasks(): Promise<TaskModel[]> {
    const where = {
      $and: [
        {
          type: 'file',
        },
        { action: this.action },
      ],
      $or: [
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
    console.log(`${this.channel}:start`);
    ipcMain.on(`${this.channel}:start`, (event: IpcMainEvent) => {
      console.log(`${this.channel}:start`);
      event.reply(this.channel, { message: `${this.action} job started` });
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
    ipcMain.on(`${this.channel}:resume`, (event, { taskIds = [] }) => {
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
    ipcMain.on(`${this.channel}:pause`, (ev, payload) => {
      this.pause(ev, payload);
    });
  }

  async getSourceInfo(fileId: number) {
    console.log('getSrouceInfo payload---->', fileId);
    const file = await File.findById(fileId);
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
    if (!file.local) {
      throw new Error('file not exists');
    }

    if (!fs.existsSync(file.local)) {
      throw new Error('file not exists');
    }
    const meta = await getFileMeta(file.local);
    return { source: file.local, meta };
  }

  async buildPayload(task: TaskModel): Promise<UploadPayload | undefined> {
    const payload = {
      password: '',
      local: '',
      fileId: task.sourceId,
      taskId: '',
      name: '',
      action: task.action,
    } as UploadPayload;
    payload.taskId = task.id;
    const password = getTaskPassword(task.id as number);
    if (task.action === 'encrypt') {
      if (!password) {
        return;
      }
      payload.password = md5(password);
    }
    const fileId = task.sourceId;
    const file = await File.findById(fileId);
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
      payload.local = file.local;
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
        type: 'task',
        action: this.action,
        status: 'uploading',
        taskId,
        size,
        percent: cursor / size,
        speed: (cursor - lastPoint) / interval,
        file: file,
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
        event.reply(this.channel, {
          taskId,
          status: 'finish',
          action: this.action,
          type: 'task',
        });
      },
    });
    return res;
  }

  async addFile(event: IpcMainEvent, payload: Omit<UploadPayload, 'parentId'>) {
    const { name } = payload;
    const bucket = getAvailableBucket('file');
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
    // const secret = payload.password;
    // const res = await driver.multipartUpload(source, dest, {
    //   ...payload,
    //   isEncrypt: payload.cryptType === 'encrypt',
    //   isDecrypt: payload.cryptType === 'decrypt',
    //   taskId,
    //   secret,
    //   onProgress: this.progress(event, source, taskId as string),
    //   onFinish: async () => {
    //     event.reply(this.channel, {
    //       taskId,
    //       status: 'finish',
    //       action: this.action,
    //       type: 'task',
    //     });
    //   },
    // });
    const data: Record<string, any> = {
      ...meta,
      local: '',
      remote,
      md5: res,
      bucket: bucket.name,
    };
    return data;
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
        : getAvailableBucket(payload.bucketType);
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
  success(event: IpcMainEvent, payload: any, result?: any) {
    if (this.channel) {
      event.reply(this.channel, {
        status: 'success',
        message: 'success',
        type: 'task',
        action: this.action,
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
        type: 'task',
        action: this.action,
        payload,
        err,
      });
    }
  }
}
