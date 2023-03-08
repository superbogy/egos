import { addConnection, Migration } from '@egos/lite';
import { loadSetting } from './config';
import path from 'path';
import { registerChannel } from './channel';
import { registerJob } from './jobs';
import './models';
import { BrowserWindow } from 'electron';
import { registerEvent } from './event';

export default async (win: BrowserWindow) => {
  const setting = await loadSetting();
  console.log('ss', setting.setup);
  // @todo
  if (setting.setup) {
    const db = await addConnection('egos', {
      filename: setting.db as string,
    });
    const folder = path.join(path.dirname(__filename), 'migration');
    const migrate = new Migration(db, folder);
    await migrate.run();
  }
  registerChannel();
  registerJob();
  registerEvent(win);
};
