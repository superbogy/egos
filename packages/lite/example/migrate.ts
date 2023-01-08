import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { addConnection } from '../src';
import { Migration } from '../src/migration';

const main = async () => {
  const folder = path.join(path.dirname(__filename), 'migration');
  console.log('FFFFF', path.dirname(__filename), folder);
  const db = await addConnection({
    name: 'default',
    filename: './test.db',
    driver: sqlite3.Database,
  });
  console.log('dddddb', db);
  const migration = new Migration(db, folder);
  await migration.run();
};

main().catch((err) => console.log(err));
