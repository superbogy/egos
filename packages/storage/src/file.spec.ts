import { FileDriver } from './file';
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

import { LocalDriver } from './file-stream';
import { CryptoService } from './security';

const createTmpFile = () => {
  return path.join(os.tmpdir(), 'egos', uuid());
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
  it.skip('able to upload file multi chunk', async () => {
    const driver = new FileDriver(bucket);
    const source = createTmpFile();
    await fillFile(source, 1024 * 1024 * 5);
    const dest = createTmpFile();
    const hash = '861759ca48644dd97296b0008318bacf';
    const target = createTmpFile();
    const dfile = createTmpFile();
    const secret = md5('abrsf').substring(16);
    const res = await driver.multipartUpload(source, dest, {
      isEncrypt: true,
      secret,
    });
    expect(res).toEqual(hash);
    const stat = fs.statSync(target);
    const chunkSize = 1024 * 1024;
    const chunkNumber = Math.ceil(stat.size / chunkSize);
    let cursor: number = 0;
    let iv: Buffer;
    const rfd = await fsp.open(target);
    const md5ash = crypto.createHash('md5');
    const chunk = Buffer.alloc(chunkSize + 32);
    console.log(chunk.length);
    await rfd.read(chunk, 0, chunk.length, cursor);
    iv = chunk.subarray(0, 16);
    const encrypted = chunk.subarray(16);
    const decryptService = new CryptoService(secret, iv);
    const res2 = decryptService.decrypt(encrypted);
    //   for (let partNumber = 0; partNumber < chunkNumber; partNumber++) {
    //     const chunk = Buffer.alloc(chunkSize + 16);
    //     await rfd.read(chunk, 0, chunk.length, cursor);
    //     cursor += chunk.length;
    //     console.log('chunk len', chunk.length);
    //     const res = (decryptService as CryptoService).decrypt(chunk);
    //     md5ash.update(res);
    //   }
    //   console.log(md5ash.digest('hex'));
    //   const fd = await fsp.open(target);
  });
  it('should upload file', async () => {
    const driver = new LocalDriver();
    const totalBytes = 1024 * 1024;
    const source = createTmpFile();
    const dest = createTmpFile();
    await fillFile(source, totalBytes);
    const speed = jest.fn();
    const sourceMd5 = await md5File(source);
    const res = await driver.upload(source, dest, { speed });
    await setTimeout(2000);
    expect(sourceMd5).toEqual(res);
    expect(speed).toHaveBeenCalled();
    fs.unlinkSync(source);
    fs.unlinkSync(dest);
  });
  it('should upload file and encrypt', async () => {
    const driver = new LocalDriver();
    const totalBytes = 1024 * 1024;
    const source = createTmpFile();
    const dest = createTmpFile();
    const decryptFile = createTmpFile();
    await fillFile(source, totalBytes);
    const sourceMd5 = await md5File(source);
    const secret = md5('abrsf').substring(16);
    await driver.upload(source, dest, { secret, speed: console.log });
    await setTimeout(1000);
    await driver.decrypt(dest, decryptFile, { secret });
    const deCryptMd5 = await md5File(decryptFile);
    expect(sourceMd5).toEqual(deCryptMd5);
    fs.unlinkSync(source);
    fs.unlinkSync(dest);
    fs.unlinkSync(decryptFile);
  }, 10000);
});
