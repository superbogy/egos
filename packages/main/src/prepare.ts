import { addConnection, Migration } from '@egos/lite';
import { loadSetting } from './config';
import { Database } from 'sqlite3';
import path from 'path';
import { registerChannel } from './channel';

export default async () => {
  const setting = await loadSetting();
  if (setting.setup) {
    const db = await addConnection({
      name: 'default',
      filename: setting.db as string,
      driver: Database,
    });
    const folder = path.join(path.dirname(__filename), 'migration');
    const migrate = new Migration(db, folder);
    await migrate.run();
  }
  import('./models');
  registerChannel();
};
