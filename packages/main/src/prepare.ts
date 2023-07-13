import { addConnection, Migration } from '@egos/lite';
import { loadSetting } from './config';
import path from 'path';
import { registerChannel } from './channel';
import { registerJob } from './jobs';
import './models';
import { BrowserWindow } from 'electron';
import { registerEvent } from './event';
import { getServer } from './server';

export default async (win: BrowserWindow) => {
  const setting = await loadSetting();
  // can't move into if conditon
  const db = await addConnection('egos', {
    filename: setting.db as string,
  });
  // @todo
  if (!setting.setup || 1) {
    console.log(123);
    const folder = path.join(path.dirname(__filename), 'migration');
    const migrate = new Migration(db, folder);
    await migrate.run();
  }
  registerChannel();
  registerJob();
  registerEvent(win);
  getServer();
};
