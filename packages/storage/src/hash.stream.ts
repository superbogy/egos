import { Transform, TransformCallback, TransformOptions } from 'stream';
import crypto from 'crypto';

export type CAlculateCallback = (len: number, cost: number) => any;

export class HashStream extends Transform {
  private algorithm: string;
  private hash: crypto.Hash;
  constructor(opts?: TransformOptions & { algorithm?: string }) {
    super(opts);
    this.algorithm = opts?.algorithm || 'md5';
    this.hash = crypto.createHash(this.algorithm);
  }
  _transform(
    chunk: any,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this.hash.update(chunk);
    this.push(chunk, encoding);
    callback();
  }

  _flush(callback: TransformCallback): void {
    callback();
  }

  getHash() {
    return this.hash.digest('hex');
  }
}
