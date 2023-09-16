import fs from 'fs';
import path from 'path';
import { fromStream } from 'file-type';
import Mime from 'mime';
import os from 'os';
import { FileMeta } from '../interface';
import { getConfig } from '../config';
import { app } from 'electron';
import getAvailablePort from 'get-port';
import { File, FileObject, FileObjectSchema, Photo } from '../models';
import { getDriverByBucket } from './bucket';
import { getSharedVar } from '../global';
import { createDecryptStream } from '@egos/storage/dist/security';
import { md5 } from '@egos/storage';

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

export const getFileObjectBySourceId = async (sourceId: string | null) => {
  if (!sourceId) {
    return null;
  }
  const fileObj = await FileObject.findById(sourceId);
  if (!fileObj) {
    return null;
  }
  const driver = getDriverByBucket(fileObj.bucket);
  const p = driver.getPath(fileObj.remote);
  return { ...fileObj.toJSON(), path: p } as FileObjectSchema & {
    path: string;
  };
};

export const parseFileRequest = async (request: any) => {
  const params = new URL(request.url);
  const fileId = params.searchParams.get('fileId');
  const type = params.searchParams.get('type');
  if (!fileId) {
    return null;
  }
  const fileObj = await FileObject.findById(fileId);
  if (!fileObj) {
    return null;
  }
  const driver = getDriverByBucket(fileObj.bucket);
  const p = driver.getPath(fileObj.remote);
  const file = await File.findOne({ objectId: fileObj.id });
  if (!file) {
    return null;
  }
  if (file.isEncrypt) {
    // @todo specific handle for video range
    const secret = getSharedVar(`file:preview:secret:${fileId}`);
    const stream = await createDecryptStream(p, md5(secret));
    return { data: stream, mimeType: fileObj.mime, statusCode: 200 };
  }
  const range = request.headers.Range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileObj.size - 1;
    // const end = res.size - 1;
    const chunksize = end - start + 1;
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${fileObj.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(chunksize),
      'Content-Type': 'video/mp4',
    };
    const stream = fs.createReadStream(p, { start, end });
    return {
      statusCode: 206,
      data: stream,
      mimeType: fileObj.mime,
      headers,
    };
  }
  const stream = fs.createReadStream(p);
  return { data: stream, mimeType: fileObj.mime, statusCode: 200 };
};
