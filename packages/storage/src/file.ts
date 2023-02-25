import crypto from 'crypto';
import fs, { promises as fsp } from 'fs';
import path from 'path';
import Stream from 'stream/promises';
import util from 'util';
import { ServiceError } from './error';
import { getNoneExistedFilename, md5 } from './utils';
import Driver from './abstract';
import { FileObject } from './interface';
import { CryptoService } from './security';

export class FileDriver extends Driver {
  static serviceName = 'LOCAL';
  static _schema = {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        label: 'path',
        description: 'file storage path',
      },
    },
    required: ['path'],
  };
  getPath(dest: string) {
    const bucket = this.bucket;
    if (!bucket || !bucket.config) {
      throw new ServiceError({
        message: 'Invalid bucket',
      });
    }
    const p = path.join(bucket.config.path, dest);
    const base = path.dirname(p);
    if (!fs.existsSync(base)) {
      fs.mkdirSync(base, { recursive: true });
    }
    return p;
  }

  async getFile(remote: string) {
    return fs.createReadStream(this.getPath(remote));
  }

  async download(remote: string, save: string) {
    const readable = await this.getStream(remote);
    const writable = fs.createWriteStream(save);
    return Stream.pipeline(readable, writable);
  }

  async replaceFile(source: string, dest: string) {
    return this.addFile(source, dest, { flag: 'w+' });
  }

  async deleteFile(remote: string) {
    await fsp.unlink(this.getPath(remote));
    return true;
  }

  async copyFile(from: string, dest: string) {
    const readable = fs.createReadStream(this.getPath(from));
    const writable = fs.createWriteStream(this.getPath(dest));
    return Stream.pipeline(readable, writable);
  }

  async getStream(remote: string) {
    return fs.createReadStream(this.getPath(remote));
  }

  async getFileContent(file: FileObject) {
    const stream = await this.getStream(file.remote);
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks).toString('utf-8');
  }

  async getCacheFilePath(file: FileObject) {
    return this.getPath(file.remote);
    // try {
    //   const readable = this.getStream(fileId);
    //   const tmpdir = os.tmpdir();
    //   const baseDir = path.resolve(tmpdir, '.2gos');
    //   const cacheFile = path.resolve(tmpdir, '.2gos', fileId);
    //   if (fs.existsSync(cacheFile)) {
    //     return cacheFile;
    //   }
    //   if (!fs.existsSync(baseDir)) {
    //     fs.mkdirSync(baseDir, { recursive: true });
    //   }

    //   const writable = fs.createWriteStream(cacheFile);
    //   await Stream.pipeline(readable, writable);
    //   return cacheFile;
    // } catch (err) {
    //   console.log('cacheFile error', err);
    //   return '';
    // }
  }

  async getUrl(remote: string) {
    const p = this.getPath(remote);
    return `http://local-egos${p}`;
  }

  async getCacheFile(fileObj: FileObject) {
    return this.getCacheFilePath(fileObj);
  }

  async addFile(
    source: string,
    dest: string,
    options: Record<string, any> = {},
  ) {
    const stream =
      typeof source === 'string' ? fs.createReadStream(source) : source;
    const writable = fs.createWriteStream(this.getPath(dest), options);
    await Stream.pipeline(stream, writable);
    return true;
  }

  async multipartUpload(
    source: string,
    dest: string,
    options: Record<string, any> = {},
  ) {
    const isInflight = this.inflight(options.taskId);
    if (!isInflight) {
      return false;
    }
    const stat = fs.statSync(source);
    const chunkSize = 1024 * 1024 * 1;
    if (stat.size < chunkSize) {
      return this.addFile(source, dest, options);
    }
    const doneParts = await this.getDoneParts(dest, 'upload');
    const readable = await fsp.open(source, 'r');
    console.log(this.getPath(dest));
    const fd = await fsp.open(this.getPath(dest), 'a+');
    const chunkNumber = Math.ceil(stat.size / chunkSize);
    const hash = crypto.createHash('md5');
    let writeCursor: number = 0;
    const cryptoService = new CryptoService(options.secret);
    const isEncrypt = options.isEncrypt || false;
    for (let partNumber = 0; partNumber < chunkNumber; partNumber++) {
      if (this.isCancel(options.taskId)) {
        this.afterCancel(options.taskId);
        await readable.close();
        await fd.close();
        return false;
      }
      // await setTimeout(5000);
      const cursor = partNumber * chunkSize;
      const len =
        cursor + chunkSize > stat.size ? stat.size - cursor : chunkSize;
      const chunk = Buffer.alloc(len);
      await readable.read(chunk, 0, len, cursor);
      if (!chunk) {
        break;
      }
      hash.update(chunk);
      const writeChunk = isEncrypt ? cryptoService.encrypt(chunk) : chunk;
      const eTag = md5(writeChunk);
      const done = doneParts.find((item) => {
        return Number(item[2]) === partNumber && item[0] === String(eTag);
      });
      if (done) {
        continue;
      }
      await fd.write(writeChunk, undefined, undefined, writeCursor);
      writeCursor += writeChunk.length;
      await this.doneChunk({
        dest,
        type: 'upload',
        size: chunkSize,
        partNumber,
        eTag,
      });
      if (options.progress) {
        await Promise.resolve(
          options.progress({
            size: chunkSize,
            partNumber,
            eTag,
            percent: Math.round((partNumber / chunkNumber) * 1000) / 1000,
            taskId: options.taskId,
            total: stat.size,
            length: len,
          }),
        );
      }
    }
    await readable.close();
    await fd.close();
    await this.clearLocalChunkFile(dest, 'upload');
    if (options.onFinish) {
      await options.onFinish({ ...options });
    }
    this.onFinish(options.taskId);
    const md5Hash = hash.digest('hex');
    console.log('file md5::', md5Hash);
    return md5Hash;
  }

  async multipartDownload(
    remote: string,
    savePath: string,
    { size, filename, taskId, ...options }: any,
  ) {
    const chunkSize = 1024 * 1024 * 2;
    const chunkNumber = Math.ceil(size / chunkSize);
    const remoteFile = this.getPath(remote);
    const stat = fs.statSync(remoteFile);
    const doneParts = await this.getDoneParts(this.getPath(remote), 'download');
    const local = path.join(savePath, path.basename(remote) + '.parts');
    const wfd = await fsp.open(local, 'a+');
    const rfd = await fsp.open(this.getPath(remote), 'r');
    for (let partNumber = 1; partNumber <= chunkNumber; partNumber++) {
      if (this.isCancel(taskId)) {
        this.afterCancel(taskId);
        await wfd.close();
        await rfd.close();
        return false;
      }
      const cursor = (partNumber - 1) * chunkSize;
      const len = cursor + chunkSize > size ? size - cursor : chunkSize;
      const chunk = Buffer.alloc(len);
      await rfd.read(chunk, 0, len, cursor);
      if (!chunk) {
        break;
      }
      const eTag = md5(chunk);
      const done = doneParts.find((item) => {
        return Number(item[2]) === partNumber && item[0] === String(eTag);
      });
      if (done) {
        // const donePart = Buffer.alloc(len);
        // await wfd.read(donePart, 0, len, cursor);
        // const doneHash = md5(donePart);
        // if (doneHash === eTag) {
        //    continue;
        // }
        continue;
      }
      await wfd.write(chunk, undefined, undefined, cursor);
      await this.doneChunk({
        dest: this.getPath(remote),
        type: 'download',
        size: chunkSize,
        partNumber,
        eTag,
      });
      if (options.progress) {
        await Promise.resolve(
          options.progress({
            size: chunkSize,
            partNumber,
            eTag,
            percent: Math.round((partNumber / chunkNumber) * 1000) / 1000,
            taskId,
            total: size,
            length: len,
          }),
        );
      }
    }
    const renameFile = await getNoneExistedFilename(filename, savePath);
    await util.promisify(fs.rename)(local, renameFile);
    await rfd.close();
    await wfd.close();
    await this.clearLocalChunkFile(remote, 'download');
    return renameFile;
  }

  async clearFragment(dest: string, type: string) {
    await this.clearLocalChunkFile(dest, type);
    const file = this.getPath(dest);
    if (fs.existsSync(file)) {
      await util.promisify(fs.unlink)(this.getPath(dest));
    }
  }
}
