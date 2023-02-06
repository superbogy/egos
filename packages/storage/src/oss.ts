import OSS from 'ali-oss';
import fs, { promises as fsp } from 'fs';
import path from 'path';

import { ServiceError } from './error';
import { getNoneExistedFilename, md5 } from './utils';
import Driver from './abstract';
import { BucketItem, FileObject } from './interface';

export class OssDriver extends Driver {
  static serviceName = 'OSS';
  static _schema = {
    type: 'object',
    properties: {
      bucket: {
        type: 'string',
        label: 'bucket',
        description: 'Bucket name',
      },
      accessKeyId: {
        type: 'string',
        label: 'accessKeyId',
        description: 'Access key ID',
      },
      accessKeySecret: {
        type: 'string',
        label: 'accessKeySecret',
        description: 'Access key secret',
      },
      region: {
        type: 'string',
        label: 'region',
        description: 'Region',
      },
      domain: {
        type: 'string',
        label: 'domain',
        description: 'External request domain name',
      },
      secure: {
        type: 'boolean',
        require: false,
        label: 'secure',
        description: 'HTTPS (secure: true) or HTTP (secure: false)',
      },
    },
    required: ['bucket', 'accessKeyId', 'accessKeySecret'],
  };
  private client: OSS;
  constructor(bucket: BucketItem) {
    super(bucket);
  }

  /**
   *
   * @returns <OSS>
   */
  getClient(): OSS {
    if (this.client) {
      return this.client;
    }
    const bucket = this.bucket;
    if (!bucket || !bucket.config) {
      throw new ServiceError({
        message: 'invalid bucket config',
        code: 104000,
      });
    }
    bucket.config.region = 'oss-cn-guangzhou';
    this.client = new OSS(bucket.config as OSS.Options);
    return this.client;
  }

  async thumbnail(file: FileObject) {
    // const filename = await hasha.async(fileObj.filename + fileObj.id, { algorithm: 'md5' });
    const cachedFile = await this.getCacheFilePath(file);
    if (cachedFile) {
      return cachedFile;
    }
    await this.getClient().get(file.remote, cachedFile, {
      process: 'image/resize,m_fixed,h_120',
    });
    return cachedFile;
  }

  async saveAs(fileObj: FileObject, savePath: string) {
    const file = await getNoneExistedFilename(fileObj.remote, savePath);
    await this.getClient().get(fileObj.remote, file);
  }

  async addFile(source: string, dest: string) {
    return this.getClient().put(source, dest);
  }

  async multipartUpload(source: string, dest: string, options: any = {}) {
    const isInflight = this.inflight(options.taskId);
    if (!isInflight) {
      return false;
    }
    const client = this.getClient();
    const stat = fs.statSync(source);
    const chunkSize = 1024 * 1024 * 2;
    let uploadId = options.uploadId;
    let doneParts = [];
    const { progress } = options;
    if (uploadId) {
      doneParts = await this.getDoneParts(dest, options.uploadId);
    }
    if (!doneParts.length) {
      const res = await client.initMultipartUpload(dest);
      if (progress) {
        await Promise.resolve(
          progress({ uploadId: res.uploadId, initial: true }),
        );
      }
      uploadId = res.uploadId;
    }

    const readable = await fsp.open(source, 'r');
    const maxNumber = Math.ceil(stat.size / chunkSize);
    for (let partNumber = 1; partNumber <= maxNumber; partNumber++) {
      if (this.isCancel(options.taskId)) {
        this.afterCancel(options.taskId);
        break;
      }
      const cursor = (partNumber - 1) * chunkSize;
      const len = partNumber === maxNumber ? stat.size - cursor : chunkSize;
      const chunk = Buffer.alloc(len);
      await readable.read(chunk, 0, len, cursor);
      if (!chunk) {
        break;
      }
      const eTag = md5(chunk).toUpperCase();
      const done = doneParts.find((item) => {
        return (
          Number(item.PartNumber) === partNumber &&
          item.ETag.replace(/"/g, '') === eTag
        );
      });
      if (done) {
        continue;
      }
      const res = await client.uploadPart(
        dest,
        uploadId,
        partNumber,
        source,
        cursor,
        cursor + len,
      );
      if (progress) {
        await Promise.resolve(
          progress({
            size: chunkSize,
            partNumber,
            eTag,
            uploadId,
            percent: partNumber / maxNumber,
            taskId: options.taskId,
            length: len,
          }),
        );
      }
      doneParts.push({
        PartNumber: partNumber,
        ETag: res.etag,
        Size: len,
      });
    }
    const parts = doneParts.map((item) => ({
      number: Number(item.PartNumber),
      etag: item.ETag,
    }));
    await client.completeMultipartUpload(dest, uploadId, parts);
    await readable.close();
    this.onFinish(options.taskId);
    return true;
  }

  async multipartDownload(
    remote: string,
    savePath: string,
    { size, filename, taskId }: any,
  ) {
    return true;
  }

  async getDoneParts(name: string, uploadId: string) {
    try {
      let res: any[] = [];
      let offset: number = 0;
      const maxPart: number = 1000;
      while (true) {
        const result = await this.getClient().listParts(name, uploadId, {
          'max-part': maxPart,
          'part-number-marker': offset,
        } as any);
        const parts = result.parts;
        res = res.concat(parts);
        if (parts.length < maxPart) {
          break;
        }
        offset = Number(result.PartNumberMarker);
      }
      return res;
    } catch (err) {
      console.log('getDoneParts err:', err);
      return [];
    }
  }

  async replaceFile(source: string, dest: string) {
    return this.addFile(source, dest);
  }

  async deleteFile(remote: string) {
    await this.getClient().delete(remote);
    return true;
  }

  async copyFile(source: string, dest: string) {
    return this.getClient().copy(source, dest);
  }

  async getStream(remote: string) {
    const { stream } = await this.getClient().getStream(remote);
    return stream;
  }

  async getFileContent(fileObj: FileObject) {
    const file = await this.getCacheFile(fileObj);
    const stream = fs.createReadStream(file);
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks).toString('utf-8');
  }

  async getUrl(remote: string) {
    return this.getClient().getObjectUrl(remote);
  }

  async clearFragment(dest: string, type: string, options: any) {
    if (type === 'download') {
      await this.clearLocalChunkFile(dest, type);
    } else if (options.uploadId) {
      await this.getClient().abortMultipartUpload(dest, options.uploadId);
    }
  }

  async getCacheFilePath(file: FileObject) {
    const cachePath = path.join('', 'files');
    if (!fs.existsSync(cachePath)) {
      await fsp.mkdir(cachePath, { recursive: true });
    }
    const cacheId = [
      path.basename(file.remote),
      path.extname(file.filename) || `.${file.ext}`,
    ].join('');
    const cacheFile = path.join(cachePath, cacheId);
    return cacheFile;
  }

  async getCacheFile(file: FileObject) {
    const cacheFile = await this.getCacheFilePath(file);
    await this.download(file.remote, cacheFile);
    return cacheFile;
  }
}
