import { getBucketByName } from '@/lib/bucket';
import { File, FileModel, FileObject, Task } from '@/models';
import { Job, Model } from '@egos/lite';
import { getDriver } from '@egos/storage';
import { IpcMainEvent, ipcMain } from 'electron';
import { FileUploadJob } from './file-upload';
import { BucketItem } from '@/config';
import { FileJob } from './file.job';
import { FILE_CRYPT_START } from '@/event/constant';

export class CryptJob extends FileJob {
  constructor(setting: any) {
    super();
    this.channel = setting.channel;
    this.action = 'crypt';
  }
  watch() {
    ipcMain.on(FILE_CRYPT_START, (event: IpcMainEvent) => {
      event.reply(this.channel, { message: 'upload job started' });
      this.run(event)
        .then(() => {
          event.reply(this.channel, {
            status: 'done',
            type: 'job',
            message: 'crypt job done',
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
  }
  async run(event: IpcMainEvent, options?: any) {
    try {
      await FileUploadJob.locker.acquireAsync();
      const where = { type: 'crypt', ...options };
      const tasks = await Task.dequeue({ where, limit: 50, retry: 100 });
      if (!tasks.length) {
        return;
      }
      for (const task of tasks) {
        if (task.retry >= task.maxRetry) {
          continue;
        }
        if (task.action === 'encrypt') {
          const { payload } = task;
          if (!payload) {
            continue;
          }
          const fileInfo = await File.findById(payload.fileId);
          if (!fileInfo) {
            task.status = 'notFound';
            await task.save();
            return;
          }
          task.status = 'processing';
          event.reply(this.channel, {
            taskId: task.id,
            type: task.type,
            status: 'processing',
            retry: task.retry,
          });
          await task.save();
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      this.locker.release();
    }
  }

  async handler(event: IpcMainEvent, objId: string, taskId: string) {
    const task = await Task.findById(taskId);
    if (!task) {
      return;
    }
    const fileObj = await FileObject.findById(objId);
    if (!fileObj) {
      task.status = 'notFound';
      await task.save();
      return;
    }
    const bucket = getBucketByName(fileObj.bucket) as BucketItem;
    const driver = getDriver(bucket);
    const local = driver.getPath(fileObj.remote);
    const ext = '.encrypt';
    const name =
      task.action === 'encrypt' ? local + ext : local.replace(ext, '');
    const payload = task.payload;
    await this.addFile(event, {
      ...task.payload,
      local,
      name,
      fileId: fileObj.id,
      taskId: task.id,
      bucket,
    })
      .then(async (res: any) => {
        if (!res || !res.id) {
          return;
        }
        task.status = 'done';
        task.targetId = payload.fileId;
        await task.save();
        this.success(event, {
          ...payload,
          taskId: task.id,
          targetId: payload.fileId,
        });
      })
      .catch(async (err) => {
        console.log('fuck err', err);
        if (task.retry > task.maxRetry) {
          task.status = 'unresolved';
          task.err = err.message;
          task.retry += 1;
          this.failure(event, payload, err.message);
          await task.save();
        }
      });
  }

  encrypt(event: IpcMainEvent) {}
}
