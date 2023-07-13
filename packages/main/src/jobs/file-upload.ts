import Locker from 'await-lock';
import fs, { promises as sfp } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { getAvailableBucket, getDriverByBucket } from '../lib/bucket';
import { File } from '../models/file';
import { Task, TaskSchema } from '../models/task';
import { SynchronizeJob } from './synchronize';
import { IpcMainEvent } from 'electron';
import { FileJob } from './file.job';
import { FileObject } from '../models';
import { JobOptions, UploadPayload } from './interfaces';

export class FileUploadJob extends FileJob {
  protected locker = new Locker();
  protected options: JobOptions;
  protected syncJob: any;
  protected channel: string;
  constructor(options: JobOptions) {
    super(options);
    this.syncJob = new SynchronizeJob();
  }

  async process(event: IpcMainEvent, payload: UploadPayload) {
    const bucket = getAvailableBucket('file');
    const { local, taskId, password, fileId } = payload;
    if (!local) {
      throw new Error('local file not found');
    }
    const file = await File.findByIdOrError(payload.fileId);
    const stat = await promisify(fs.stat)(local);
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
          status: 'done',
        };
        const current = await File.create(child);
        await this.process(event, {
          ...payload,
          local: path.join(local, item),
          fileId: current.id,
          taskId,
        });
      }
      return file.toJSON();
    }
    const fileObj = await this.addFile(event, {
      ...payload,
      local,
      taskId,
      password,
    });
    if (!fileObj) {
      return null;
    }
    // @fixme should update the logic
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

    return res.toJSON();
  }
}
