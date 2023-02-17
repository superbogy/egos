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

export interface UploadPayload {
  local: string;
  parentId: number;
  name: string;
  event: IpcMainEvent;
  taskId: string;
  bucket: { name: string };
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
  private channel: string;
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
            message: 'upload job done',
          });
        })
        .catch((err) => {
          event.reply(this.channel, { status: 'error', message: err.message });
        });
    });
    ipcMain.on(FILE_UPLOAD_RESUME, (event, { taskIds = [] }) => {
      this.run(event, { id: { $in: taskIds }, status: 'pause' }).catch(
        (err) => {
          event.reply(this.channel, { status: 'failed', message: err.message });
        },
      );
    });
    ipcMain.on(FILE_UPLOAD_PAUSE, (ev, payload) => {
      this.pause(ev, payload);
    });
  }

  async pause(
    event: IpcMainEvent,
    { taskIds, channel }: { taskIds: number[]; channel: string },
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
        await Task.update({ id: task.id }, { status: 'pause' });
        event.reply(this.channel, {
          taskId: task.id,
          status: 'pause',
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
          message: 'ok',
          err: null,
        });
      });
    }
  }

  async upload({
    local,
    parentId,
    name,
    event,
    taskId,
    bucket,
  }: UploadPayload) {
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
      const newFolder = await File.create(folder);
      const files = await sfp.readdir(local);
      for (const item of files) {
        await this.upload({
          local: path.join(local, item),
          parentId: newFolder.id,
          name,
          event,
          taskId,
          bucket,
        });
      }
      return newFolder.toJSON();
    } else {
      const fileObj = await this.addFile({
        local,
        name,
        taskId,
        event,
        bucket,
      });
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

  async addFile(payload: Omit<UploadPayload, 'parentId'>) {
    const { local, name, event, taskId, bucket } = payload;
    if (!fs.existsSync(local)) {
      throw new Error('file not exists');
    }
    const fileItem = [name || uuid().toHexString()];
    const remote = path.join(...fileItem);
    const driver = getDriver(bucket);
    const meta = await getFileMeta(local);
    const progress = async (checkpoint: CheckPoint) => {
      const { size, total, partNumber, taskId, percent } = checkpoint;
      const task = await Task.findById(taskId);
      if (!task) {
        return;
      }
      const cpt = task.checkpoint || {};
      if (!cpt.percent || cpt.percent < percent) {
        task.checkpoint = checkpoint;
        await task.save();
      }
      if (!event) {
        return;
      }
      event.reply(this.channel, {
        message: 'progress',
        taskId,
        size,
        percent,
        file: local,
        partNumber,
        total,
      });
    };
    const res = await driver.multipartUpload(local, remote, {
      taskId,
      progress,
    });
    if (!res) {
      return null;
    }
    const data = {
      ...meta,
      local: '',
      remote,
      bucket: bucket.name,
    };

    return await FileObject.insert({ ...data });
  }

  async run(event: IpcMainEvent, options?: any) {
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
        if (task.action === 'upload') {
          const { payload } = task;
          if (!payload) {
            continue;
          }
          task.status = 'processing';
          event.reply(this.channel, {
            taskId: task.id,
            status: 'processing',
            retry: task.retry,
          });
          const bucket = getAvailableBucket('file');
          await this.upload({
            ...payload,
            type: task.type,
            event,
            taskId: task.id,
            bucket,
          })
            .then((res = {}) => {
              if (!res || !res.id) {
                return;
              }
              task.status = 'done';
              task.targetId = res.id;
              this.success(event, {
                ...payload,
                taskId: task.id,
                targetId: res.id,
              });
            })
            .catch((err) => {
              console.log('fuck err', err);
              if (task.retry > task.maxRetry) {
                task.status = 'unresolved';
                task.err = err.message;
                task.retry += 1;
                task.save();
                this.failure(event, payload, err.message);
              }
            });
          await task.save();
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      FileUploadJob.locker.release();
    }
  }

  success(event: IpcMainEvent, payload: any, result?: any) {
    if (this.options.channel) {
      event.reply(this.channel, {
        status: 'success',
        message: 'success',
        payload,
        result,
      });
    }
  }

  failure(event: IpcMainEvent, payload: any, err: any) {
    if (this.channel) {
      event.reply(this.channel, { message: 'failed', payload, err });
    }
  }
}
