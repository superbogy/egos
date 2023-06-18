import {
  getAvailableBucket,
  getBucketByName,
  getDriverByBucket,
} from '../lib/bucket';
import { getFileMeta } from '../lib/helper';
import { File, FileObject, Task } from '../models';
import { getDriver } from '@egos/storage';
import fs from 'fs';
import { ServiceError } from '../error';
import { UploadPayload } from './interfaces';
import { IpcMainEvent } from 'electron';
import uuid from 'bson-objectid';
import { getTaskPassword } from './helper';
import Driver from '@egos/storage/dist/abstract';

export abstract class FileJob {
  protected channel: string;
  protected action: string;

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

  progress(event: IpcMainEvent, file: any) {
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

  async addFile(event: IpcMainEvent, payload: Omit<UploadPayload, 'parentId'>) {
    const { name, taskId } = payload;
    const bucket = getAvailableBucket('file');
    const driver = getDriver(bucket);
    const { source, meta } = await this.getSourceInfo(payload);
    const remote = name || uuid().toHexString();
    const dest = driver.getPath(remote);
    const secret = payload.password;
    console.log('bbbbbefore--', { ...payload, taskId, secret });
    const res = await driver.multipartUpload(source, dest, {
      ...payload,
      taskId,
      secret,
      onProgress: this.progress(event, source),
      onFinish: async () => {
        event.reply(this.channel, {
          taskId,
          status: 'finish',
          action: this.action,
          type: 'task',
        });
      },
    });
    console.log('storage upload res', res);
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
    if (payload.fileId) {
      const file = await File.findById(payload.fileId);
      const fileObj = await FileObject.findById(file?.fileId as number);
      const originSource = driver.getPath(fileObj?.remote as string);
      fs.unlinkSync(originSource);
    }
    const fileObj = await FileObject.upsert({ ...data });
    return fileObj;
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
