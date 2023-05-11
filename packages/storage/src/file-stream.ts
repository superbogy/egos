import fs, { promises as fsp } from 'fs';
import path from 'path';
import util from 'util';
import Stream, { Writable, Readable, Transform } from 'stream';
import { createDecryptStream, createEncryptStream } from './security';
import { SpeedStream } from './speed-stream';
import { HashStream } from './hash.stream';
import Driver from './abstract';
import { FileObject, UploadOptions } from './interface';
import { ServiceError } from './error';
import md5file from 'md5-file';
import WebTorrent from 'webtorrent';

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
    const p = super.getPath(dest);
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
    const file = this.getPath(remote);
    if (fs.existsSync(file)) {
      return;
    }
    await fsp.link(file, save);
  }

  async replaceFile(source: string, dest: string) {
    return this.addFile(source, dest);
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
  }

  async getUrl(remote: string) {
    const p = this.getPath(remote);
    return `atom://local-egos${p}`;
  }

  async getCacheFile(fileObj: FileObject) {
    return this.getCacheFilePath(fileObj);
  }
  async multipartUpload(
    source: string,
    dest: string,
    options: UploadOptions,
  ): Promise<string | boolean> {
    return this.upload(source, dest, options);
  }
  async upload(source: string, dest: string, options: UploadOptions) {
    try {
      const readable = fs.createReadStream(source);
      const isInflight = this.inflight(options.taskId);
      console.log('isInflight', isInflight, options, this._inflight);
      if (isInflight) {
        return false;
      }
      const donePart = await this.getDoneParts(dest, 'upload');
      const stat = await fsp.stat(source);
      console.log('donePart', donePart, stat);
      if (stat.size === donePart.cursor) {
        return md5file(source);
      }
      const remote = dest;
      console.log('file-->', source, remote);
      const writable = fs.createWriteStream(remote, {
        start: donePart.cursor,
        mode: 0o666,
      });
      const md5 = new HashStream();
      let sourceStream: Readable | Transform = readable;
      if (options.secret) {
        sourceStream = createEncryptStream(readable, options.secret);
      }
      const pipelines: Stream[] = [sourceStream, md5];
      const speedStream = new SpeedStream({ span: options.interval });
      speedStream.calculate(
        async (cursor: number, lastPoint: number, span: number) => {
          console.log('speed', cursor, lastPoint);
          if (options.onProgress) {
            await Promise.resolve(
              options.onProgress({
                cursor,
                lastPoint,
                interval: span,
                size: stat.size,
              }),
            );
          }
          await this.doneChunk({ dest, type: 'upload', cursor: lastPoint });
          this.refreshInflightTask(options.taskId);
        },
      );
      writable.on('finish', async () => {
        console.log('fuck on finish');
        setTimeout(() => this.clearFragment(dest, 'upload'), speedStream.span);
        if (options.onFinish) {
          await Promise.resolve(options.onFinish({ taskId: options.taskId }));
        }
      });
      this.onFinish(options.taskId);
      pipelines.push(speedStream);
      pipelines.push(writable);
      await Stream.promises.pipeline(pipelines as ReadonlyArray<any>);
      const fuck = fs.statSync(remote);
      console.log('fffuck', fuck);
      return md5.getHash();
    } catch (err) {
      throw err;
    }
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

  async uploadFromMagnet(magnet: string, dest: string, options: UploadOptions) {
    // @todo
    const client = new WebTorrent();
    // const torrent = client.add(magnet, (t) => console.log(t));
    const res = await new Promise((resolve, reject) => {
      client.add(magnet, function (torrent) {
        // Got torrent metadata!
        console.log('Client is downloading:', torrent.infoHash);
        const video = torrent.files.find((file: any) => {
          if (file.name.match(/\.mkv/)) {
            return true;
          }
          return false;
        });
        resolve(video);
      });
    });
    console.log(res);
    // console.log(torrent.files);
  }
}
