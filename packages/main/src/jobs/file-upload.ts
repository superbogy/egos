import Locker from 'await-lock';
import fs, { promises as sfp } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { getAvailableBucket, getDriverByBucket } from '../lib/bucket';
import { File } from '../models/file';
import { Task } from '../models/task';
import { SynchronizeJob } from './synchronize';
import { IpcMainEvent } from 'electron';
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

  async run(event: IpcMainEvent, options?: any): Promise<any> {
    try {
      await this.locker.acquireAsync();
      // make sure only one task in running
      const tasks = await this.getTasks();
      console.log(this.constructor.name, tasks);
      for (const task of tasks) {
        const payload = await this.buildPayload(task);
        console.log('tasksss payload>>>', payload);
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
    const { local, name, taskId, password, fileId } = payload;
    if (!local) {
      throw new Error('local file not found');
    }
    const file = await File.findByIdOrError(payload.fileId);
    const stat = await promisify(fs.stat)(local);
    console.log('iiiiis folder', payload);
    if (stat.isDirectory()) {
      const files = await sfp.readdir(local);
      for (const item of files) {
        const childPath = path.join(file.path, item);
        const source = path.join(local, item);
        const stat = await promisify(fs.stat)(source);
        const isDir = stat.isDirectory();
        const child = {
          parentId: fileId,
          filename: item,
          path: childPath,
          size: 0,
          isFolder: isDir ? 1 : 0,
          objectId: 0,
          description: '',
          type: isDir ? 'folder' : 'file',
          password,
          local: source,
          status: 'uploading',
        };
        const current = await File.create(child);
        await this.upload(event, {
          ...payload,
          local: path.join(local, item),
          fileId: current.id,
          taskId,
        });
      }
      return file.toJSON();
    }
    const data = await this.addFile(event, {
      ...payload,
      local,
      taskId,
      password,
    });
    if (!data) {
      return null;
    }
    const fileObj = await FileObject.create({ ...data });
    if (file.status === 'done') {
      const previosObj = await FileObject.findById(file?.objectId as number);
      if (!previosObj) {
        return null;
      }
      const driver = getDriverByBucket(previosObj.bucket);
      const originSource = driver.getPath(previosObj.remote as string);
      fs.unlinkSync(originSource);
      await previosObj.destroy(previosObj.id);
    }

    const current = await File.findByIdOrError(payload.fileId);
    const res = await current.updateAttributes({
      objectId: fileObj.id,
      password,
      isEncrypt: payload.action === 'encrypt' ? 1 : 0,
      status: 'done',
      size: fileObj.size,
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
          objectId: fileObj.id,
        });
      });
      this.syncJob.start();
    }

    return res.toJSON();
  }
}
