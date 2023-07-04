import CryptoJS from 'crypto-js';
import Stream, { Transform, Readable, Writable, ReadableOptions } from 'stream';
import crypto from 'crypto';
import { md5 } from './utils';
import fs from 'fs';

export class CryptoService {
  private iv: Buffer;
  private secret: string | Buffer;
  private algorithm: string;
  private initial: boolean;
  constructor(key: string, iv?: Buffer) {
    this.iv = Buffer.from(key);
    this.secret = key;
    this.algorithm = 'aes-128-cbc';
    this.initial = false;
  }

  encrypt(chunk: Buffer): Buffer {
    const cipher = crypto.createCipheriv(this.algorithm, this.secret, this.iv);
    const ciphertext = [cipher.update(chunk), cipher.final()];
    if (!this.initial) {
      this.initial = true;
      console.log(
        'encrypt hs',
        md5(chunk),
        md5(Buffer.concat([this.iv, ...ciphertext])),
      );
      return Buffer.concat([this.iv, ...ciphertext]);
    }
    return Buffer.concat([...ciphertext]);
  }

  decrypt(chunk: Buffer): Buffer {
    const cipher = crypto.createDecipheriv(
      this.algorithm,
      this.secret,
      this.iv,
    );
    console.log(this.iv, this.algorithm, this.secret, md5(chunk));
    const ciphertext = [cipher.update(chunk), cipher.final()];
    return Buffer.concat([...ciphertext]);
  }

  final() {
    this.initial = false;
  }
}

const encrypt = (buffer: Buffer, key: string) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  const result = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
  return result;
};

const decrypt = (encrypted: Buffer, key: string) => {
  // Get the iv: the first 16 bytes
  const iv = encrypted.subarray(0, 16);
  encrypted = encrypted.subarray(16);
  // Create a decipher
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  // Actually decrypt it
  const result = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return result;
};

export function createEncryptStream(
  source: Stream | string,
  pass: string,
): Transform {
  let initialized: boolean = false;
  const iv = crypto.randomBytes(16);
  console.log(iv);
  const readable =
    source instanceof Stream ? source : fs.createReadStream(source);
  const key = crypto.scryptSync(pass, 'salt', 32);
  const encryptStream = crypto.createCipheriv('aes-256-cbc', key, iv);
  const transform = new Transform({
    transform(chunk, encoding, callback) {
      if (!initialized) {
        initialized = true;
        this.push(Buffer.concat([iv, chunk]), encoding);
      } else {
        this.push(chunk, encoding);
      }
      callback();
    },
  });

  return readable.pipe(encryptStream).pipe<Transform>(transform);
}

export const createDecryptStream = async (
  source: string | Readable,
  pass: string,
) => {
  if (source instanceof Readable) {
    const iv: Buffer = await new Promise((resolve, reject) => {
      source.once('readable', () => {
        resolve(source.read(16));
      });
      source.once('error', reject);
    });
    const key = crypto.scryptSync(pass, 'salt', 32);
    const decryptStream = crypto.createDecipheriv('aes-256-cbc', key, iv);
    return source.pipe<Transform>(decryptStream);
  } else {
    const fd = await fs.promises.open(source);
    const iv = Buffer.alloc(16);
    await fd.read(iv, 0, 16, 0);
    await fd.close();
    const readable = fs.createReadStream(source, { start: 16 });
    console.log('decrypt', pass, pass.length);
    const key = crypto.scryptSync(pass, 'salt', 32);
    const decryptStream = crypto.createDecipheriv('aes-256-cbc', key, iv);
    return readable.pipe<Transform>(decryptStream);
  }
};
