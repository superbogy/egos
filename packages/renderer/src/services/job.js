import Queue from './queue';
import delay from 'delay';
import { upload } from './uploader';
import Locker from 'await-lock';

const locker = new Locker();

export default class Job {
  constructor(options) {
    this.options = options;
  }

  async run() {
    try {
      await locker.acquireAsync();
      const tasks = Queue.dequeue();
      if (!tasks.length) {
        return;
      }
      for (const task of tasks) {
        // if (task.retry >= task.maxRetry) {
        //   continue;
        // }
        if (task.table !== 'photos') {
          if (task.action === 'upload') {
            const { payload } = task;
            if (!payload) {
              continue;
            }
            task.status = 'processing';
            task.retry += 1;
            const taskItem = task.save();
            const photo = JSON.parse(payload);
            await upload(photo)
              .then(() => {
                taskItem.status = 'done';
              })
              .catch((err) => {
                if (taskItem.retry > taskItem.maxRetry) {
                  taskItem.status = 'unresolved';
                  taskItem.err = err.message;
                }
              })
              .finally(() => {
                return taskItem.save();
              });
          }
        }
      }
    } catch (err) {
      console.log(err.message);
      throw err;
    } finally {
      await delay(1000);
      locker.release();
    }
  }
}
