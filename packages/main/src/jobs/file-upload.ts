import Locker from 'await-lock';
import fs, { promises as sfp } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { getAvailableBucket, getDriverByBucket } from '../lib/bucket';
import { File, FileModel } from '../models/file';
import { Task, TaskModel } from '../models/task';
import { SynchronizeJob } from './synchronize';
import { ipcMain, IpcMainEvent } from 'electron';
import {
  // FILE_UPLOAD_CANCEL,
  FILE_UPLOAD_PAUSE,
  FILE_UPLOAD_RESUME,
  FILE_UPLOAD_START,
} from '../event/constant';
import { getTaskPassword } from './helper';
import Driver from '@egos/storage/dist/abstract';
import { FileJob } from './file.job';
import { FileObject } from '../models';
import { JobOptions, UploadPayload } from './interfaces';

export class FileUploadJob extends FileJob {
  private locker = new Locker();
  private readonly options: JobOptions;
  private syncJob: any;
  protected channel: string;
  constructor(options: JobOptions) {
    super();
    this.options = options;
    this.syncJob = new SynchronizeJob();
    this.channel = options.channel;
    this.action = options.action;
  }

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
        {
          status: 'processing',
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
    };
    const tasks = await Task.find(where, { limit: 50 });
    if (!tasks.length) {
      return [];
    }
    return tasks.filter((t) => {
      return t.retry < t.maxRetry;
    });
  }

  async run(event: IpcMainEvent, options?: any): Promise<any> {
    try {
      await this.locker.acquireAsync();
      // make sure only one task in running
      const tasks = await this.getTasks();
      for (const task of tasks) {
        const payload = await this.buildPayload(task);
        if (!payload) {
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

  async upload(event: IpcMainEvent, payload: UploadPayload) {
    const bucket = getAvailableBucket('file');
    const { local, parentId, name, taskId, password } = payload;
    if (!local) {
      throw new Error('local file not found');
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
        objectId: 0,
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
          ...payload,
          local: path.join(local, item),
          parentId: current.id,
          name,
          taskId,
        });
      }
      return current.toJSON();
    } else {
      const data = await this.addFile(event, {
        ...payload,
        local,
        name,
        taskId,
        password,
      });
      if (!data) {
        return null;
      }
      console.log('create file object', data);
      const fileObj = await FileObject.create({ ...data });
      if (payload.fileId) {
        const file = await File.findById(payload.fileId);
        const previosObj = await FileObject.findById(file?.objectId as number);
        if (!previosObj) {
          return null;
        }
        const driver = getDriverByBucket(previosObj.bucket);
        const originSource = driver.getPath(previosObj.remote as string);
        fs.unlinkSync(originSource);
      }
      if (!fileObj) {
        throw new Error('upload file failed');
      }
      const filename = fileObj.filename;
      let res: FileModel;
      if (payload.fileId) {
        const file = (await File.findById(payload.fileId)) as FileModel;
        file.objectId = fileObj.id;
        file.password = password || '';
        file.isEncrypt = payload.cryptType === 'encrypt' ? 1 : 0;
        res = await file.save();
      } else {
        res = await File.create({
          parentId: parentId || 0,
          filename,
          path: path.join(...filepath, fileObj.filename),
          size: fileObj.size,
          type: fileObj.type,
          isFolder: 0,
          objectId: fileObj.id,
          description: '',
          password,
          isEncrypt: payload.cryptType === 'encrypt',
        });
      }

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
            objectId: fileObj.id,
          });
        });
        this.syncJob.start();
      }

      return res.toJSON();
    }
  }
}
