import Locker from 'await-lock';
import { getDriver, getNoneExistedFilename } from '@egos/storage';
import fs, { promises as fsp } from 'fs';
import path from 'path';

import {
  getAvailableBucket,
  getBucketByName,
  getDriverByBucket,
} from '../lib/bucket';
import { getDownloadPath, getFileMeta } from '../lib/helper';
import { File } from '../models/file';
import { FileObject } from '../models/file-object';
import { Task } from '../models/task';
import { SynchronizeJob } from './synchronize';
import { IpcMainEvent } from 'electron';
import { ServiceError } from '../error';
import { FileJob } from './file.job';
import { DownloadPayload, JobOptions } from './interfaces';

export class FileDownloadJob extends FileJob {
  static locker = new Locker();
  private readonly options: JobOptions;
  private locker: Locker;
  protected channel: string;
  constructor(options: JobOptions) {
    super();
    this.options = options;
    this.locker = new Locker();
    this.channel = options.channel;
  }

  async run(event: IpcMainEvent, options?: any): Promise<any> {
    try {
      await this.locker.acquireAsync();
      const tasks = await this.getTasks();
      for (const task of tasks) {
        if (task.retry >= task.maxRetry) {
          continue;
        }
        const payload = (await this.buildPayload(task)) as DownloadPayload;
        if (!payload) {
          continue;
        }
        await task.updateAttributes({ status: 'processing' });
        event.reply(this.channel, {
          taskId: task.id,
          type: 'download',
          status: 'processing',
          retry: task.retry,
        });
        const savePath = fs.existsSync(payload.savePath)
          ? payload.savePath
          : getDownloadPath();
        await this.process(event, {
          ...payload,
          savePath,
          taskId: task.id,
        })
          .then(async () => {
            await Task.update({ id: task.id }, { status: 'done' });
          })
          .catch(async (err) => {
            if (task.retry <= task.maxRetry) {
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

  async pause(event: IpcMainEvent, { taskIds }: { taskIds: number[] }) {}
  async cancel(
    event: IpcMainEvent,
    { taskIds, type }: { taskIds: number[]; type: string },
  ) {}

  async process(
    event: IpcMainEvent,
    payload: DownloadPayload,
  ): Promise<boolean> {
    const { fileId, savePath } = payload;
    const fileItem = await File.findById(fileId as number);
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
    const file = await File.findById(fileId as number);
    const fileObj = await FileObject.findById(file?.objectId as number);
    if (!fileObj) {
      return false;
    }
    const driver = getDriverByBucket(fileObj.bucket);
    const dest = getNoneExistedFilename(savePath, payload.name as string);
    const source = driver.getPath(fileObj.remote);
    const writeParams = {
      source,
      dest,
      password: payload.password,
      crypto: file?.isEncrypt ? 'decrypt' : '',
    };
    await this.write(event, writeParams);
    return true;
  }
}
