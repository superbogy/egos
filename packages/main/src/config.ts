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
export const homedir = path.join(os.homedir(), '.egos');

export const config = {
  db: path.join(homedir, 'database/egos.db'),
  configFile: path.join(homedir, 'config/egos.yaml'),
  fileHost: 'http://egos.local',
  storage: path.join(homedir, 'storage'),
  plugins: path.join(homedir, 'plugins'),
} as Record<string, any>;
const defaultSetting = {
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
        path: path.join(config.storage, 'files'),
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
        path: path.join(config.storage, 'images'),
      },
    },
  ],
};

let setting: Record<string, any> | null = null;
export const loadSetting = async (): Promise<any> => {
  if (setting) {
    return setting;
  }
  if (fs.existsSync(config.configFile)) {
    setting = yaml.load(fs.readFileSync(config.configFile, 'utf8')) as Record<
      string,
      any
    >;
  } else {
    await writeConfig(defaultSetting);
    return defaultSetting;
  }

  return setting;
};

export const getSetting = () => {
  return setting;
};

export const writeConfig = async (cfg: any) => {
  if (!cfg) {
    return;
  }
  try {
    await lock.acquireAsync();
    const validate = ajv.compile(schema);
    console.log(validate);
    if (validate(cfg)) {
      const data = yaml.dump(cfg);
      const configPath = path.dirname(config.configFile);
      if (!fs.existsSync(configPath)) {
        await fs.promises.mkdir(configPath, { recursive: true });
      }
      await fs.promises.writeFile(config.configFile, data, { flag: 'w+' });
      setting = null;
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
