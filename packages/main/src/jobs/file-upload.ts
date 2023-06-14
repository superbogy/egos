import Locker from 'await-lock';
import { getDriver, md5 } from '@egos/storage';
import fs, { promises as sfp } from 'fs';
import path from 'path';
import { promisify } from 'util';
import {
  getAvailableBucket,
  getBucketByName,
  getDriverByBucket,
} from '../lib/bucket';
import { getFileMeta } from '../lib/helper';
import { File, FileModel } from '../models/file';
import { FileObject, FileObjectModel } from '../models/file-object';
import { Task, TaskModel } from '../models/task';
import { SynchronizeJob } from './synchronize';
import { ipcMain, IpcMainEvent } from 'electron';
import {
  // FILE_UPLOAD_CANCEL,
  FILE_UPLOAD_PAUSE,
  FILE_UPLOAD_RESUME,
  FILE_UPLOAD_START,
} from '../event/constant';
import { getTaskPassword, getTaskSecret } from './helper';
import { ServiceError } from '../error';
import Driver from '@egos/storage/dist/abstract';
import { FileJob } from './file.job';

export interface UploadPayload {
  local: string;
  parentId?: number;
  name?: string;
  taskId: string | number;
  bucket?: { name: string };
  fileId?: number;
  isEncrypt?: boolean;
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
export class FileUploadJob extends FileJob {
  static locker = new Locker();
  private readonly options: JobOptions;
  private locker: Locker;
  private syncJob: any;
  protected channel: string;
  constructor(options: JobOptions) {
    super();
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
      // make sure only one task in running
      const where = { action: 'upload', type: 'file', ...options };
      const tasks = await Task.dequeue({ where, limit: 50, retry: 100 });
      if (!tasks.length) {
        return;
      }
      for (const task of tasks) {
        if (task.retry >= task.maxRetry) {
          continue;
        }
        const payload: UploadPayload = task.payload as UploadPayload;
        if (!payload) {
          continue;
        }
        const secret = getTaskSecret(task.id);
        if (!secret && payload.isEncrypt) {
          continue;
        }
        await task.updateAttributes({ status: 'processing' });
        event.reply(this.channel, {
          taskId: task.id,
          type: 'upload',
          status: 'processing',
          retry: task.retry,
        });
        await this.upload(event, { ...payload, taskId: task.id })
          .then(async () => {
            await Task.update({ id: task.id }, { status: 'done' });
          })
          .catch(async (err) => {
            console.log('err', err);
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
    const password = getTaskPassword(taskId as number);
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
        password,
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
        password,
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

  async encrypt(event: IpcMainEvent, payload: UploadPayload) {
    const fileObj = await this.addFile(event, payload);
    if (!fileObj) {
      return null;
    }
    if (!payload.fileId) {
      return fileObj;
    }
    const cur = (await FileObject.findById(payload.fileId)) as Record<
      string,
      any
    >;
    const driver = getDriverByBucket(fileObj.bucket) as Driver;
    // clean origin file
    await driver.deleteFile(cur.remote);
    const password = getTaskPassword(payload.taskId as number);
    if (password) {
      // @fixme simple md5 hash without any salt
      await File.update({ id: payload.fileId }, { password: md5(password) });
    }
    return fileObj;
  }

  async decrypt(event: IpcMainEvent, payload: any) {
    const { taskId, fileId } = payload;
    const fileObj = await FileObject.findById(payload.fileId);
    if (!fileObj) {
      return;
    }
    const driver = getDriverByBucket(fileObj.bucket) as Driver;
    const password = getTaskPassword(payload.taskId as number);
    const source = driver.getPath(fileObj.remote);
    const dest = payload.dest;
    //
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
}
