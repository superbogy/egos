import os from 'os';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import { BUCKET_STATUS, Drivers } from './constants';
import AwaitLock from 'await-lock';
import Ajv, { ErrorObject } from 'ajv';

const lock = new AwaitLock();
const ajv = new Ajv();
const schema = {
  type: 'object',
  properties: {
    setup: { type: 'boolean' },
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

export interface Configuration {
  db: string;
  configFile: string;
  fileHost: string;
  storage: string;
  plugins: string;
  setup: boolean;
  privateKey: string;
  algorithm: string;
  trashTTL: number;
  defaultBucket: string;
  translators: string[];
  articleUploadUrl: string;
  buckets: Record<string, any>[];
}

export interface BucketItem {
  alias: string;
  name: string;
  type: string;
  prefix: string;
  status: BUCKET_STATUS;
  driver: Drivers;
  synchronize: [];
  config: Record<string, string>;
}

export const homedir = path.join(os.homedir(), '.egos');

export const base = {
  db: path.join(homedir, 'database/egos.db'),
  configFile: path.join(homedir, 'config/egos.yaml'),
  fileHost: 'http://egos.local',
  storage: path.join(homedir, 'storage'),
  plugins: path.join(homedir, 'plugins'),
} as Record<string, any>;

const defaultConfig = {
  setup: true,
  privateKey: 'bar',
  algorithm: 'aes-256-cbc',
  trashTTL: 30,
  defaultBucket: '',
  translators: ['all'],
  articleUploadUrl: 'data-url',
  buckets: [
    {
      alias: 'local-file',
      name: 'local-file',
      type: 'file',
      prefix: '',
      status: BUCKET_STATUS.ACTIVE,
      driver: Drivers.LOCAL,
      synchronize: [],
      config: {
        path: path.join(base.storage, 'files'),
      },
    },
    {
      alias: 'local-image',
      name: 'local-image',
      type: 'image',
      prefix: '',
      status: BUCKET_STATUS.ACTIVE,
      driver: Drivers.LOCAL,
      synchronize: [],
      config: {
        path: path.join(base.storage, 'images'),
      },
    },
  ],
};

let config: Configuration | null = null;
export const loadSetting = async (): Promise<any> => {
  if (config) {
    return config;
  }
  if (fs.existsSync(base.configFile)) {
    config = yaml.load(
      fs.readFileSync(base.configFile, 'utf8'),
    ) as Configuration;
  } else {
    await writeConfig(defaultConfig);
    return defaultConfig;
  }

  return config;
};

export const getConfig = (): Configuration => {
  return config as Configuration;
};

export const writeConfig = async (config: any) => {
  if (!config) {
    return;
  }
  try {
    await lock.acquireAsync();
    const validate = ajv.compile(schema);
    if (validate(config)) {
      const data = yaml.dump(config);
      const configPath = path.dirname(base.configFile);
      if (!fs.existsSync(configPath)) {
        await fs.promises.mkdir(configPath, { recursive: true });
      }
      await fs.promises.writeFile(base.configFile, data, { flag: 'w+' });
      config = null;
      lock.release();
    } else {
      console.log(validate.errors);
      throw (validate.errors as ErrorObject[])[0];
    }
  } catch (err) {
    lock.release();
    throw err;
  }
};
