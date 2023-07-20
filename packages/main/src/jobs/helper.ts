import { File, FileObject } from '../models';
import { getSharedVar, setSharedVar } from '../global';
import crypto from 'crypto';
import { getBucketByName } from '../lib/bucket';
import { getDriver } from '@egos/storage';
import { getFileMeta } from '../lib/helper';
import fs from 'fs';
import { ServiceError } from '../error';

export const getTaskSecretKey = (taskId: number) => {
  return ['task', 'secret', 'key', taskId].join(':');
};
export const getTaskPassword = (taskId: number) => {
  const key = getTaskSecretKey(taskId);
  const pwd = getSharedVar(key);
  return pwd;
};

export const getTaskSecret = (taskId: number) => {
  const pwd = getTaskPassword(taskId);
  if (!pwd) {
    return null;
  }
  const hash = crypto.createHash('sha1');
  return hash.update(pwd).digest('hex').substring(16, 32);
};

export const setTaskSecret = (taskId: number, pass: string) => {
  const key = getTaskSecretKey(taskId);
  setSharedVar(key, pass);
};

export const getSourceInfo = async (payload: {
  local?: string;
  fileId?: number;
}) => {
  if (payload.fileId) {
    const file = await File.findById(payload.fileId);
    if (!file) {
      throw new Error('File not found');
    }
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
  if (payload.local) {
    if (!fs.existsSync(payload.local)) {
      throw new Error('file not exists');
    }
    const meta = await getFileMeta(payload.local);
    return { source: payload.local, meta };
  }
  throw new ServiceError({
    message: 'invalid upload payload',
  });
};
