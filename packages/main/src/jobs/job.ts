import { getDriverByBucket } from '@/lib/bucket';
import { Task } from '../models';
import { JobOptions, WriteFileParams } from './interfaces';
import { IpcMainEvent, ipcMain } from 'electron';

export abstract class Job {
  protected channel: string;
  protected action: string;
  protected type: string;
  protected options: JobOptions;

  async getTasks(): Promise<any> {}

  async run(event: IpcMainEvent, options?: any) {}

  async cancel(
    event: IpcMainEvent,
    { taskIds, type }: { taskIds: number[]; type: string },
  ) {}

  async pause(event: IpcMainEvent, { taskIds }: { taskIds: number[] }) {}

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
        status: 'processing',
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

  watch() {
    ipcMain.on(`${this.channel}:start`, (event: IpcMainEvent) => {
      console.log('job start', this.type);
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

  async success(event: IpcMainEvent, payload: any, result?: any) {
    event.reply(this.channel, {
      status: 'success',
      message: 'success',
      type: this.type,
      action: this.action,
      ...payload,
      result,
    });
  }

  failure(event: IpcMainEvent, payload: any, err: any) {
    event.reply(this.channel, {
      message: payload.message || 'failure',
      status: 'failure',
      type: 'task',
      action: this.action,
      payload,
      err,
    });
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
}
