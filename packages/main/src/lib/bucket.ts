import Ajv from 'ajv';
import AwaitLock from 'await-lock';
import fs, { promises as fsp } from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { BUCKET_STATUS } from '../constants';
import { getDriver } from '@egos/storage';
import { ServiceError } from '@/error';
import { getConfig, writeConfig, homedir } from '@/config';

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
  return config.buckets.map((item) => {
    item.defaultBucket = config.defaultBucket === item.name;
    return item;
  });
};

export const updateBucket = async ({ defaultBucket, ...bucket }: any) => {
  const driver = getDriver(bucket);
  driver.validate(bucket.config);
  const config = getConfig();
  if (defaultBucket) {
    if (bucket.status === BUCKET_STATUS.DISABLE) {
      throw new ServiceError({
        message: 'default bucket must be active',
      });
    }
    config.defaultBucket = defaultBucket;
  }
  const index = config.buckets.findIndex((item) => item.name === bucket.name);
  if (index === -1) {
    bucket.name = uuid();
    config.buckets.push(bucket);
  } else {
    config.buckets[index] = bucket;
  }
  console.log('bucketUpdate', config);
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
    console.log(b.type === type, isActive);
    return type ? b.type === type && isActive : isActive;
  });
  console.log('buckets & type', buckets, type, bucket);
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
    return null;
  }
  return getDriver(bucket);
};
