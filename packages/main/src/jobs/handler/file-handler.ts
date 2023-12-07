import { getBucketByName, getDriverByBucket } from '@/lib/bucket';
import { File, FileObject, TaskSchema } from '../../models';
import { Handler } from './abstract';
import { getDriver, md5 } from '@egos/storage';
import { getFileMeta } from '../../lib/helper';
import fs from 'fs';
import { UploadPayload } from '../interfaces';
import { getTaskPassword } from '../helper';
import Driver from '@egos/storage/dist/abstract';

export class FileHandler extends Handler {
  async getSourceInfo(fileId: number) {
    const file = await File.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }
    if (file.status === 'done') {
      const fileObj = await FileObject.findById(file.objectId);
      if (!fileObj) {
        throw new Error('File object not found');
      }
      const bucket = getBucketByName(fileObj.bucket);
      const driver = getDriver(bucket);
      const source = driver.getPath(fileObj.remote);
      return {
        source,
        meta: {
          filename: fileObj.filename,
          type: fileObj.type,
          mime: fileObj.mime,
          ext: fileObj.ext,
          size: fileObj.size,
          mtime: fileObj.mtime,
        },
      };
    }
    if (!fs.existsSync(file.url)) {
      throw new Error('file not exists');
    }
    const meta = await getFileMeta(file.url);
    return { source: file.url, meta };
  }

  async buildPayload(task: TaskSchema): Promise<UploadPayload | undefined> {
    const payload = {
      password: '',
      local: '',
      fileId: task.sourceId,
      taskId: task.id,
      name: '',
      action: task.action,
    } as UploadPayload;
    const password = getTaskPassword(task.id as number);
    if (task.action === 'encrypt') {
      if (!password) {
        return;
      }
      payload.password = md5(password);
    }
    let fileId = task.sourceId;
    const file = await File.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }
    if (task.action === 'encrypt' && file.isEncrypt) {
      return;
    }
    if (file.status === 'done') {
      const fileObj = await FileObject.findById(file.objectId);
      if (!fileObj) {
        throw new Error('Fileobject not found');
      }
      const driver = getDriverByBucket(fileObj.bucket) as Driver;
      payload.local = driver.getPath(fileObj.remote);
      const ext = '.egos';
      const name =
        task.action === 'encrypt'
          ? fileObj.remote + ext
          : fileObj.remote.replace(ext, '');
      payload.name = name;
    } else {
      payload.name = '';
      payload.local = file.url;
    }

    return payload;
  }
}
