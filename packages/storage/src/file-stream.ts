import fs from 'fs';
import Stream, { Writable, Readable, Transform } from 'stream';
import { createDecryptStream, createEncryptStream } from './security';
import { SpeedStream } from './speed-stream';
import crypto from 'crypto';
import { HashStream } from './hash.stream';

export class LocalDriver {
  async upload(source: string, dest: string, options: any) {
    const writable = fs.createWriteStream(dest, { mode: 0o666 });
    const md5 = new HashStream();
    const readable = options.secret
      ? createEncryptStream(source, options.secret)
      : fs.createReadStream(source);
    const pipelines: Stream[] = [readable, md5];
    if (options.speed) {
      const speedStream = new SpeedStream({ span: options.speedInterval });
      speedStream.calculate(options.speed);
      pipelines.push(speedStream);
    }
    pipelines.push(writable);
    await Stream.promises.pipeline(pipelines as ReadonlyArray<any>);
    return md5.getHash();
  }

  async decrypt(source: string, dest: string, options: any) {
    const readable = await createDecryptStream(source, options.secret);
    const writable = fs.createWriteStream(dest);
    if (options.speed) {
      const speedStream = new SpeedStream();
      speedStream.calculate(options.speed);
      return Stream.promises.pipeline(readable, speedStream, writable);
    }
    return Stream.promises.pipeline(readable, writable);
  }

  async speedStream() {
    return new Transform({
      transform(chunk: Buffer) {
        this.push(chunk);
      },
    });
  }
}
