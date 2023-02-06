import CryptoJS from 'crypto-js';
import Stream, { Transform, Writable } from 'stream';
import crypto from 'crypto';

export const encrypt = (ciphertext: string, secretKey: string) => {
  return CryptoJS.AES.encrypt(ciphertext, secretKey, {
    mode: CryptoJS.mode.CFB,
    padding: CryptoJS.pad.ZeroPadding,
  });
};

export const decrypt = (ciphertext: string, secretKey: string) => {
  return CryptoJS.AES.decrypt(ciphertext, secretKey, {
    mode: CryptoJS.mode.CFB,
    padding: CryptoJS.pad.ZeroPadding,
  });
};

export function createEncryptStream(input: Stream, pass: string): Stream {
  let initialized: boolean = false;
  const iv = crypto.randomBytes(32);
  const encryptStream = crypto.createCipheriv('aes-192-cbc', pass, iv);
  return input.pipe(encryptStream).pipe(
    new Transform({
      transform(chunk, encoding, callback) {
        if (!initialized) {
          initialized = true;
          this.push(Buffer.concat([iv, chunk]));
        } else {
          this.push(chunk);
        }
        callback();
      },
    }),
  );
}

export function createDecryptStream(output: Writable, pass: string): Transform {
  let iv: string;
  return new Transform({
    transform(chunk, encoding, callback) {
      if (!iv) {
        iv = chunk.slice(0, 16);
        const decryptStream = crypto.createDecipheriv('aes-192-cbc', pass, iv);
        this.pipe(decryptStream).pipe(output);
        this.push(chunk.slice(16));
      } else {
        this.push(chunk);
      }
      callback();
    },
  });
}
