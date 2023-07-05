import { Task, TaskModel } from '../models/task';
import { FileUploadJob } from './file-upload';

export class FileCryptoJob extends FileUploadJob {
  async getTasks(): Promise<TaskModel[]> {
    const where = {
      $and: [
        { type: 'crypto' },
        { action: { $in: ['encrypt', 'decrypt'] } },
        { status: 'pending' },
      ],
    };
    const tasks = await Task.find(where, { limit: 50 });
    return tasks.filter((t) => {
      return t.retry < t.maxRetry;
    });
  }
}
