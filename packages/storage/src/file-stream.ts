import fs from 'fs';
import Stream, { Readable, Transform } from 'stream';
import { createDecryptStream, createEncryptStream } from './security';
import { md5 } from './utils';

export class LocalDriver {
  async upload(source: string, dest: string, options: any) {
    const start = 0;
    const writable = fs.createWriteStream(dest, { start, mode: 0o666 });
    // readable.on('data', (chunk: Buffer) => {
    //   console.log('readable data length', chunk.length);
    // });
    // readable.on('end', () => {
    //   console.log('There will be no more data.');
    // });
    // readable.on('pause', () => {
    //   console.log('readable pause');
    // });
    // writable.on('finish', () => {
    //   console.log('writable finish');
    // });
    // writable.on('data', (chunk: Buffer) => {
    //   console.log('writeable data length', chunk.length);
    // });
    const readable = options.encrypt
      ? createEncryptStream(source, options.secret)
      : fs.createReadStream(source);
    await Stream.promises.pipeline(readable, writable);
  }

  async decrypt(source: string, dest: string, options: any) {
    const readable = await createDecryptStream(source, options.secret);
    const writable = fs.createWriteStream(dest);
    // console.log('???!23123123', source, dest);
    // let init = false;
    // const transform = new Transform({
    //   transform(chunk, encoding, callback) {
    //     if (!init) {
    //       const h = md5(chunk);
    //       console.log('2222', chunk.length, h);
    //       init = true;
    //     }
    //     this.push(chunk);
    //     callback();
    //   },
    // });
    await Stream.promises.pipeline(readable, writable);
  }
}
