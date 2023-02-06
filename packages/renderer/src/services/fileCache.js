import path from 'path';
import { getAppCachePath, getBucketConfig } from './helper';
import { promises as fsp } from 'fs';
import { Transform } from 'stream';

class TransformStream extends Transform {
  _transform(data, encoding, callback) {
    callback(null, data);
  }
}

export default async (fileObj) => {
  const { bucketId } = fileObj;
};
