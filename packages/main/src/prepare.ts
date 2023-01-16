import { addConnection, Migration } from '@egos/lite';
import { config, loadSetting } from './config';
import { Database } from 'sqlite3';
import path from 'path';
import './models';

export default async () => {
  console.log('config', config);
  const setting = await loadSetting();
  if (!setting.setup) {
    const db = await addConnection({
      name: 'default',
      filename: config.db as string,
      driver: Database,
    });
    const folder = path.join(path.dirname(__filename), 'migration');
    const migrate = new Migration(db, folder);
    await migrate.run();
  }
};
