import Base from './base';

const QueueStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  CANCELED: 'canceled',
  UNRESOLVED: 'unresolved',
  DONE: 'done',
};

class Queue extends Base {
  _table = 'tasks';

  enqueue(data) {
    return this.insert({ ...data, status: QueueStatus.PENDING });
  }

  dequeue({ limit = 50, retry = 3 }) {
    return this.find(
      { status: { $neq: QueueStatus.DONE }, retry: { $lt: retry } },
      { limit },
    );
  }

  async getPendingUpload() {
    return this.exec('getPendingUpload');
  }

  async getTaskList(...args) {
    return this.exec('getTaskList', ...args);
  }

  async download(...args) {
    return this.exec('download', ...args);
  }

  async buildUploadTasks(...args) {
    return this.exec('buildUploadTasks', ...args);
  }

  async getTaskResultUrl(...args) {
    return this.exec('getResultUrl', ...args);
  }
}
const queue = new Queue('tasks');

export const fetchPendingTask = async () => {
  // const job = new Job();
  // return job.run();
  // return queue.dequeue();
  return queue.dequeue();
};
export default queue;

export const countTaskStatus = ({ status }) => {
  const where = {};
  if (status) {
    where.status = status;
  }
  const res = queue.find(
    {},
    { group: 'status', fields: ['count(*) as count', 'status'], rows: true },
  );
  return res;
};
