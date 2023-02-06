/** eslint-disable */
import { ipcRenderer } from 'electron';
import Lock from 'await-lock';
import { LOCAL_FILE_HOST } from './constants';

const containers: { [key: string]: any } = {};

class ModelProxy {
  modelName: string;
  channel: string;
  lock: Lock;
  constructor(name: string) {
    this.modelName = name;
    this.channel = `egos.model.${name}`;
    this.lock = new Lock();
  }

  static getInstance(name: string) {
    if (!containers[name]) {
      containers[name] = new ModelProxy(name);
    }

    return containers[name];
  }

  async execute({ method, args }: { method: string; args?: any }) {
    try {
      await this.lock.acquireAsync();
      const payload = {
        method,
        args,
      };
      const res = await ipcRenderer.invoke(this.channel, payload);
      return res;
    } catch (err) {
      console.log('exec err', err);
    } finally {
      this.lock.release();
    }
  }
}

const api = {
  getModel(name: string) {
    return ModelProxy.getInstance(name);
  },
};

(window as any).Api = api;

(window as any).Electron = {
  vars: {
    localFileHost: LOCAL_FILE_HOST,
  },
  ipcRenderer,
  dialog: {
    showOpenDialog(...args: any[]): Promise<any> {
      return ipcRenderer.invoke('dialog:showOpenDialog', ...args);
    },
  },
};
