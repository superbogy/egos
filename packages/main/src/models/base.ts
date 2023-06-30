import { connect, Model, ModelOpts } from '@egos/lite';
import { ipcMain } from 'electron';
import { getConfig } from '../config';
import { ServiceError } from '../error';

@connect('egos')
export default class Base extends Model {
  _channel: string;
  static channels: string[] = [];
  constructor(options?: ModelOpts) {
    super({ ...options, timestamp: true });
    this._channel = `egos.model.${this.table}`;
    this._options.debug = true;
    this.registerChannel();
  }

  get channel() {
    return this._channel;
  }

  registerChannel() {
    if (Base.channels.includes(this.channel)) {
      return;
    }
    Base.channels.push(this.channel);
    ipcMain.handle(this._channel, async (event: any, payload: any) => {
      try {
        console.log('[model] invoke', this._channel, payload);
        const { method, args = [] } = payload;
        const res = await this[method](...args);
        if (!res) {
          return res;
        }

        if (Array.isArray(res)) {
          return res.map((item) => {
            if (item.toJSON) {
              return item.toJSON();
            }
            return item;
          });
        }
        return res.toJSON ? res.toJSON() : res;
      } catch (err) {
        console.log('model ipc main error', err.message);
        return {
          error: true,
          message: err.message,
          code: err.code || 500,
          data: err.data,
        };
      }
    });
  }

  async findByIdOrError(id: number | string) {
    return this.findById(id).then((res) => {
      if (!res) {
        throw new ServiceError({ message: 'Record not found', code: 404 });
      }
      return res;
    });
  }
}
