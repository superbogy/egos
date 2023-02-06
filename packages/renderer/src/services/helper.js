import OSS from 'ali-oss';
import fs from 'fs';
import path from 'path';
import util from 'util';

const remote = window.electronApi;

const buckets = {};
export const getBucketConfig = (bucketObj) => {
  try {
    const { bucketId, userId } = bucketObj;
    const key = [bucketId, userId].join('#');
    const conf = JSON.parse(bucketObj.config);
    buckets[key] = conf;
    return buckets[key];
  } catch (err) {
    return null;
  }
};

export const getAppRoot = () => {
  return remote.getAppPath();
};

export const getAppPath = () => {
  remote.app.getPath('appData');
};

export const getAppCachePath = () => {
  return remote.app.getPath('cache');
};

export const getRemoteFileContent = async (file) => {
  const options = getBucketConfig(file.bucketId, file.userId);
  const oss = new OSS(options);
  const { content } = await oss.get(file.remote);
  return content.toString('utf8');
};

export const getNoneExistedFilename = async ({ remoteFile, filename, savePath }) => {
  const REMOTE_PREFIX = '';
  const filepath = remoteFile.replace(REMOTE_PREFIX, '');
  const exists = await util.promisify(fs.exists)(path.join(savePath, filepath));
  if (exists) {
    return '';
  }
  const ext = path.extname(filename);
  let i = 0;
  for (;;) {
    const postfix = [i ? `(${i})` : '', ext].join();
    const file = remoteFile.replace(ext, postfix);
    i += 1;
    const duplicated = await util.promisify(fs.exists)(path.join(savePath, file));
    if (!duplicated) {
      return file;
    }
    if (i > 10) {
      throw new Error('can not build filename');
    }
  }
};
