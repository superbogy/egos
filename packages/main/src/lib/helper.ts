import fs from 'fs';
import path from 'path';
import { fromStream } from 'file-type';
import Mime from 'mime';
import os from 'os';
import { FileMeta } from '../interface';
import { getConfig } from '../config';
import { app } from 'electron';
import getAvailablePort from 'get-port';
import { File } from '../models';

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

let port = process.env.NODE_ENV === 'development' ? 6789 : '';
let host: string = '';

export const getPort = async () => {
  if (port) {
    return port;
  }
  port = await getAvailablePort();
  return port;
};

export const getIPAddress = () => {
  if (host) {
    return host;
  }
  const interfaces = os.networkInterfaces();
  for (let devName in interfaces) {
    const iface = interfaces[devName];
    if (!iface) {
      continue;
    }
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (
        alias.family === 'IPv4' &&
        alias.address !== '127.0.0.1' &&
        !alias.internal
      ) {
        host = alias.address;
        return host;
      }
    }
  }
  return '127.0.0.1';
};

export const getAvailablePath = async (pathName: string): Promise<string> => {
  const ext = path.extname(pathName);
  const basename = path.basename(pathName);
  const baseDir = path.dirname(pathName);
  const name = basename.replace(ext, '');
  let i = 0;
  while (true) {
    const file = path.join(baseDir, name + (!i ? '' : `(${i})`) + ext);
    const check = await File.findOne({ path: file });
    if (!check) {
      return file;
    }
    i++;
  }
};
