import Ajv from 'ajv';
import AwaitLock from 'await-lock';
import fs, { promises as fsp } from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { BUCKET_STATUS } from '../constants';
import { getDriver } from '@egos/storage';
import { ServiceError } from '../error';
import { getConfig, writeConfig, homedir } from '../config';

let lock = new AwaitLock();
const ajv = new Ajv();
const schema = {
  type: 'object',
  properties: {
    privateKey: { type: 'string' },
    algorithm: { type: 'string' },
    trashTTL: { type: 'number' },
    defaultBucket: { type: 'string' },
    articleUrl: { type: 'string' },
    buckets: {
      type: 'array',
    },
  },
};

export const getBuckets = () => {
  const config = getConfig();
  return config.buckets;
};

export const updateBucket = async ({ ...bucket }: any) => {
  const driver = getDriver(bucket);
  driver.validate(bucket.config);
  const config = getConfig();
  if (bucket.isDefault) {
    if (bucket.status === BUCKET_STATUS.DISABLE) {
      throw new ServiceError({
        message: 'default bucket must be active',
      });
    }
  }
  const index = config.buckets.findIndex((item) => item.name === bucket.name);
  if (index === -1) {
    bucket.name = uuid();
    config.buckets.push(bucket);
  } else {
    config.buckets[index] = bucket;
  }
  await writeConfig(config);
};

export const getConfigPath = () => {
  // @fixme .2gos to .egos
  const p = path.resolve(homedir, '.egos/config.yaml');
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return p;
};

export const getAvailableBucket = (type: string) => {
  const buckets = getBuckets();
  const bucket = buckets.find((b) => {
    const isActive = b.status === BUCKET_STATUS.ACTIVE;
    return type ? b.type === type && isActive : isActive;
  });
  if (!bucket) {
    throw new ServiceError({
      message: 'None available bucket',
      code: 200400,
    });
  }
  return bucket;
};

export const getBucketByName = (name: string) => {
  const buckets = getBuckets();
  return buckets.find((b) => b.name === name);
};

export const getDriverByBucket = (name: string) => {
  const bucket = getBucketByName(name);
  if (!bucket) {
    throw new Error('Bucket not found');
  }
  return getDriver(bucket);
};
