import { FileDriver } from './file';
import { BucketItem } from './interface';
import { md5 } from './utils';
import fsp from 'fs/promises';
import fs from 'fs';
import { CryptoService } from './security';
import crypto from 'crypto';

import { LocalDriver } from './file-stream';

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
  it('able to upload file multi chunk', async () => {
    const driver = new FileDriver(bucket);
    const source = '/Users/tommy/Documents/multi-origin.png';
    const dest = 'multi-upload.png';
    const hash = '861759ca48644dd97296b0008318bacf';
    const target = '/Users/tommy/.egos/storage/files/multi-upload.png';
    const dfile = '/Users/tommy/Documents/multi-decrypt.png';
    const secret = md5('abrsf').substring(16);
    fs.unlinkSync(target);
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
    //   iv = Buffer.alloc(16);
    // await rfd.read(iv, 0, 16, 0);
    // cursor += 16;
    iv = chunk.subarray(0, 16);
    const encrypted = chunk.subarray(16);
    console.log('?????---md55', md5(chunk), md5(encrypted));
    const decryptService = new CryptoService(secret, iv);
    const res2 = decryptService.decrypt(encrypted);
    console.log('fuck22222', md5(res2));
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
  it.only('should be ok', async () => {
    const driver = new LocalDriver();
    const source = '/Users/tommy/Documents/multi-origin.png';
    const dest = '/Users/tommy/Documents/multi-upload-encrypt.png';
    const hash = '861759ca48644dd97296b0008318bacf';
    const target = '/Users/tommy/.egos/storage/files/multi-upload.png';
    const dfile = '/Users/tommy/Documents/multi-decrypt.png';
    const secret = md5('abrsf').substring(16);
    if (fs.existsSync(dest)) {
      fs.unlinkSync(dest);
    }
    if (fs.existsSync(dfile)) {
      fs.unlinkSync(dfile);
    }

    await driver.upload(source, dest, { secret, encrypt: true });
    await driver.decrypt(dest, dfile, { secret });
  });
});
