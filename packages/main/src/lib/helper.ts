import fs from 'fs';
import path from 'path';
import { fromStream } from 'file-type';
import Mime from 'mime';
import os from 'os';
import { FileMeta } from '../interface';
import { getConfig } from '../config';
import { app } from 'electron';

export const getFileMeta = async (file: string) => {
  const stat = await fs.promises.stat(file);
  const filename = path.basename(file);
  const stream = fs.createReadStream(file);
  const mime = (await fromStream(stream)) as FileMeta;
  const fileMeta: FileMeta = mime || { mime: '', ext: path.extname(filename) };
  if (!mime) {
    fileMeta.mime = Mime.getType(filename) as string;
  }

  let type = 'text';
  if (fileMeta.mime) {
    [type] = fileMeta.mime.split('/');
  }
  return {
    filename,
    type,
    mime: fileMeta.mime || '',
    ext: fileMeta.ext || '',
    size: stat.size,
    mtime: new Date(stat.mtime).toISOString(),
  };
};

export const jsonParser = (value: string) => {
  try {
    if (value && typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  } catch (err) {
    console.log('code json error', err, value);
    return value;
  }
};

export const jsonStringify = (obj: object) => {
  try {
    if (obj && typeof obj === 'object') {
      return JSON.stringify(obj);
    }
    return obj;
  } catch (err) {
    console.log('encode josn error', err);
    return obj;
  }
};

export const getDownloadPath = () => {
  const config = getConfig();
  if (config.downloadFolder && fs.existsSync(config.downloadFolder)) {
    return config.downloadFolder;
  }
  return app.getPath('downloads');
};

export const genNoneExistFilename = (p: string, n: string): string => {
  const ext = path.extname(p);
  const name = n.replace(ext, '');
  let i = 0;
  while (true) {
    const file = path.join(p, name + (!i ? '' : `(${i})`) + ext);
    if (!fs.existsSync(file)) {
      return file;
    }
    i++;
  }
};
