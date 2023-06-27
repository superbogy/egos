import AwaitLock from 'await-lock';
import { EventEmitter } from 'events';
import { getDriver } from '@egos/storage';
import { FileObject } from '../models/file-object';
import { Synchronize } from '../models/synchronize';
import Base from '../models/base';
import { Model } from '@egos/lite';

export class SynchronizeJob {
  private options: any;
  private ev: EventEmitter;
  private jobs: any[];
  private model: Base;
  private lock: AwaitLock;
  constructor(options?: any) {
    this.options = options || {};
    this.ev = new EventEmitter();
    this.jobs = [];
    this.model = Synchronize;
    this.ev.on('start', () => {
      this.start();
    });
    this.lock = new AwaitLock();
  }

  async add({
    fromBucket,
    toBucket,
    objectId,
  }: {
    fromBucket: string;
    toBucket: string;
    objectId: number;
  }) {
    await Synchronize.create({
      fromBucket,
      toBucket,
      objectId,
      status: 'pending',
    });
  }

  async start() {
    await this.lock.acquireAsync({ timeout: 60000 });
    try {
      const jobs = await this.model.find(
        { status: 'pending' },
        { limit: this.options.limit || 3 },
      );
      const batch = [];
      while (jobs.length) {
        const job = jobs.shift() as Model;
        job.status = 'processing';
        await job.save();
        batch.push(this.handle(job));
      }
      const res = await Promise.allSettled(batch);
      for (const item of res) {
        const job = item.status === 'fulfilled' ? item.value : item.reason;
        if (!job) {
          continue;
        }
        const fileObj = (await FileObject.findById(job.fileId)) as Model;
        const backup = fileObj.backup || [];
        const itemStatus = item.status === 'fulfilled' ? 'success' : 'failure';
        const backValue = { [job.toBucket]: itemStatus };
        const index = backup.findIndex(
          (item: any) => item.bucket === fileObj.toBucket,
        );
        if (index < 0) {
          backup.push(backValue);
        } else {
          backup[index] = backValue;
        }
        fileObj.backup = [...backup];
        await fileObj.save();
        await this.model.update({ id: job.id }, { status: itemStatus });
      }
    } catch (err) {
      console.log(err);
    } finally {
      this.lock.release();
    }
  }

  async handle(job: any) {
    try {
      const { local, toBucket, fileObj } = job;
      const file = await FileObject.findById(fileObj);
      if (!file) {
        // file have been deleted
        await job.remove();
        return null;
      }
      const backup = file.backup || [];
      const backFailed = { bucket: toBucket, status: 'failed' };
      const index = backup.findIndex((item: any) => item.bucket === toBucket);
      if (!local) {
        // @todo upload from driver
        const failed = { msg: 'missing local file', code: 101 };
        if (index < 0) {
          backup.push(backFailed);
        } else {
          backup[index] = backFailed;
        }
        await FileObject.update({ id: fileObj }, { backup });
        await this.model.update({ id: job.id }, { failed });
        return null;
      }
      const driver = getDriver(toBucket);
      await driver.multipartUpload(local, file.remote, {
        objectId: fileObj.id,
      });
      return job;
    } catch (err) {
      return Promise.reject(job);
    }
  }
}
