import OSS from 'ali-oss';
import path from 'path';
import { getBucketConfig, getAppCachePath, getNoneExistedFilename } from './helper';
// import hasha from 'hasha';
import fs from 'fs';
import util from 'util';
import Bucket from './bucket';
import { ServiceError } from '../lib/error';

export default class OssDriver {
  static buckets = [];

  static instance;

  constructor({ userId, platform, bucketId, type }) {
    this.userId = userId;
    this.platform = platform;
    this.bucketId = bucketId;
    this.type = type;
    this._clients = {};
  }

  /**
   *
   * @param {object} options
   * @returns {OssDriver}
   */
  static getInstance(options) {
    if (!OssDriver.instance) {
      OssDriver.instance = new OssDriver(options);
    }

    return OssDriver.instance;
  }

  /**
   *
   * @param {String} type bucket type
   * @returns {OSS}
   */
  getClient() {
    const type = this.type || 'file';
    if (this._clients[type]) {
      return this._clients[type];
    }
    const bucket = this.getBucket(type);
    const config = getBucketConfig(bucket);
    if (!config) {
      throw new ServiceError({ message: 'invalid bucket config', code: 104000 });
    }
    this._clients[type] = new OSS(config);

    return this._clients[type];
  }

  async getBucket() {
    const type = this.type || 'file';
    const current = OssDriver.buckets.find((item) => {
      if (this.bucketId && item.bucketId === this.bucketId) {
        return true;
      }
      return item.userId === this.userId && item.platform === this.platform && item.type === type;
    });
    if (current) {
      return current;
    }
    let bucket = null;
    if (this.bucketId) {
      bucket = await Bucket.findById(this.bucketId);
    } else {
      bucket = await Bucket.findOne({
        userId: this.userId,
        type,
        platform: this.platform,
        status: 'active',
      });
    }
    if (!bucket) {
      throw new ServiceError({ message: 'bucket not found', code: 104041 });
    }
    OssDriver.buckets.push(bucket);
    return bucket;
  }

  async thumbnail(fileObj) {
    // const filename = await hasha.async(fileObj.filename + fileObj.id, { algorithm: 'md5' });
    const { filename } = fileObj;
    const cachedFile = path.join(getAppCachePath(), 'thumb', filename);
    const exists = await util.promisify(fs.exists)(cachedFile);
    if (exists) {
      return cachedFile;
    }
    await this.getClient('resource').get(fileObj.remote, cachedFile, {
      process: 'image/resize,m_fixed,h_120',
    });
    return cachedFile;
  }

  async getRemoteFileContent(file) {
    // @todo cached result
    const { content } = await this.getClient('file').get(file.remote);
    return content.toString('utf8');
  }

  async saveAs(fileObj, savePath) {
    const bucket = OssDriver.buckets.find((item) => item.id === fileObj.bucketId);
    const bucketType = bucket.type;
    const file = await getNoneExistedFilename({
      filename: fileObj.filename,
      remoteFile: fileObj.remote,
      savePath,
    });
    await this.getClient(bucketType).get(fileObj.remote, file);
  }

  put({ remote, local }) {
    return this.getClient().put(remote, local);
  }

  /**
   *
   * @param {string} remote
   * @returns {Promise<string>}
   */
  getUrl(remote) {
    return this.getClient().signatureUrl(remote);
  }
}
