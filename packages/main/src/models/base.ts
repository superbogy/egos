import { connect, Model, ModelOpts } from '@egos/lite';
import { ipcMain } from 'electron';
import { config } from '../config';

@connect({ name: 'default', filename: config.db })
export default class Base extends Model {
  _channel: string;
  static channels: string[] = [];
  constructor(options?: ModelOpts) {
    super(options);
    this._channel = `egos.model.${this.table}`;
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
        const { method, args } = payload;
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
        console.log('model ipc main error', err);
        return err;
      }
    });
  }
}
