import { BucketItem } from './interface';
import { md5 } from './utils';
import fsp from 'fs/promises';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import os from 'os';
import { v4 as uuid } from 'uuid';
import md5File from 'md5-file';
import { setTimeout } from 'timers/promises';

import { FileDriver } from './file-stream';

const createTmpFile = () => {
  return path.join(os.tmpdir(), uuid());
};

const fillFile = async (file: string, total: number) => {
  const fd = await fsp.open(file, 'w+', 0o600);
  for (let count = 0; count < total; count++) {
    const chunk = crypto.randomBytes(1024);
    await fd.write(chunk, 0, chunk.length, count);
    count += chunk.length;
  }
  await fd.close();
};

describe('FileDriver', () => {
  const bucket: BucketItem = {
    alias: 'local-file',
    name: 'local-file',
    type: 'file',
    prefix: '',
    isDefault: true,
    status: 'active',
    driver: 'LOCAL',
    synchronize: [],
    config: { path: '/Users/tommy/.egos/storage/files' },
  };
  it('should upload file', async () => {
    const taskId = 1;
    const driver = new FileDriver(bucket);
    const totalBytes = 1024 * 1024;
    const source = createTmpFile();
    const dest = createTmpFile();
    await fillFile(source, totalBytes);
    const speed = jest.fn();
    const sourceMd5 = await md5File(source);
    const res = await driver.upload(source, dest, {
      onProgress: speed,
      taskId,
    });
    await setTimeout(2000);
    const res2 = await driver.upload(source, dest, {
      onProgress: speed,
      taskId,
    });
    console.log(res, res2);
    expect(sourceMd5).toEqual(res);
    expect(speed).toHaveBeenCalled();
    fs.unlinkSync(source);
    fs.unlinkSync(dest);
  });
  it('should upload file and encrypt', async () => {
    const taskId = 2;
    const driver = new FileDriver(bucket);
    const totalBytes = 1024 * 1024;
    const source = createTmpFile();
    const dest = createTmpFile();
    const decryptFile = createTmpFile();
    await fillFile(source, totalBytes);
    const sourceMd5 = await md5File(source);
    const secret = md5('abrsf').substring(16);
    await driver.upload(source, dest, { secret, taskId });
    await setTimeout(1000);
    await driver.decrypt(dest, decryptFile, { secret });
    const deCryptMd5 = await md5File(decryptFile);
    expect(sourceMd5).toEqual(deCryptMd5);
    fs.unlinkSync(source);
    fs.unlinkSync(dest);
    fs.unlinkSync(decryptFile);
  }, 10000);
  it.only('should able to download magnet torrent', async () => {
    const driver = new FileDriver(bucket);
    const magnet =
      'magnet:?xt=urn:btih:406303B2216385DF6AFFAB26BA83281D26DDC628';
    const dest = createTmpFile();
    await driver.uploadFromMagnet(magnet, dest, { taskId: 3 });
  }, 10000);
});
