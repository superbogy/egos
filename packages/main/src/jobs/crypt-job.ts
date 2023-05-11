import { getBucketByName } from '@/lib/bucket';
import { File, FileModel, FileObject, Task } from '@/models';
import { Job, Model } from '@egos/lite';
import { getDriver } from '@egos/storage';
import { IpcMainEvent } from 'electron';
import { FileUploadJob } from './file-upload';
import { BucketItem } from '@/config';

export class CryptJob extends FileUploadJob {
  async run(event: IpcMainEvent, options?: any) {
    try {
      await FileUploadJob.locker.acquireAsync();
      const where = { action: 'upload', type: 'crypt', ...options };
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
          const fileInfo = await File.findById(payload.fileId);
          if (!fileInfo) {
            task.status = 'unresolved';
            await task.save();
            return;
          }
          const fileObj = (await FileObject.findById(fileInfo.fileId)) as Model;
          task.status = 'processing';
          event.reply(this.channel, {
            taskId: task.id,
            type: task.type,
            status: 'processing',
            retry: task.retry,
          });
          const bucket = getBucketByName(fileObj.bucket) as BucketItem;
          const driver = getDriver(bucket);
          const local = driver.getPath(fileObj.remote);
          await this.addFile(event, {
            ...payload,
            local,
            fileId: fileObj.id,
            taskId: task.id,
            bucket,
          })
            .then((res: any) => {
              if (!res || !res.id) {
                return;
              }
              task.status = 'done';
              task.targetId = fileInfo.id;
              this.success(event, {
                ...payload,
                taskId: task.id,
                targetId: fileInfo.id,
              });
            })
            .catch(async (err) => {
              console.log('fuck err', err);
              if (task.retry > task.maxRetry) {
                task.status = 'unresolved';
                task.err = err.message;
                task.retry += 1;
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
}
