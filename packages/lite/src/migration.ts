import { Database } from 'sqlite';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { ColumnSchema, FieldTypes } from './schema';
import { column, table } from './decorators';
import { Model } from './model';
import { columnToSql, genSql } from './utils';
import Debug from 'debug';

const debug = Debug('@egos/lite:migrate');

export class Job {
  private db: Database;
  private executedSql: string[];

  constructor(db: Database) {
    this.db = db;
    this.executedSql = [];
  }
  async down(): Promise<void> {}
  async up(): Promise<void> {}

  addColumn(table: string, column: ColumnSchema) {
    const colSql = columnToSql(column);
    const sql = `ALTER TABLE \`${table}\` ADD ${colSql}`;
    return this.exec(sql);
  }

  modifyColumn(table: string, column: ColumnSchema) {
    const colSql = columnToSql(column);
    const sql = `ALTER TABLE \`${table}\` MODIFY ${colSql}`;
    return this.exec(sql);
  }

  renameColumn(table: string, from: string, to: string) {
    return this.exec(`ALTER TABLE ${table} rename \`${from}\` to \`${to}\``);
  }

  dropColumn(table: string, column: string) {
    return this.exec(`ALTER TABLE \`${table}\` DROP \`${column}\``);
  }

  dropTable(table: string) {
    return this.exec(`DROP TABLE IF EXISTS \`${table}\``);
  }

  exec(sql: string) {
    this.executedSql.push(sql);
    debug('migrate job exec sql', sql);
    return this.db.exec(sql);
  }

  getExecSql() {
    return this.executedSql;
  }
}

@table('migration')
export class MigrationHistory extends Model {
  @column({ type: FieldTypes.INT, pk: true })
  id: number;
  @column({ type: FieldTypes.TEXT, nullable: false })
  name: string;
  @column({ type: FieldTypes.TEXT, nullable: false })
  content: string;
}

export class Migration {
  private readonly db: Database;
  private readonly folder: string;
  private history: Model;
  constructor(db: Database, folder: string) {
    this.db = db;
    this.folder = folder;
    this.history = new MigrationHistory({ db: this.db });
  }

  async stepUp() {
    this.history;
  }

  async run(): Promise<void> {
    if (!fs.existsSync(this.folder)) {
      throw new Error('Migration directory not found');
    }
    const sql = genSql(this.history.table, this.history.schema);
    await this.db.exec(sql);
    const files = await fsp.readdir(this.folder);
    for (const file of files) {
      const { default: cls } = await import(path.join(this.folder, file));
      const instance: Job = new cls(this.db);
      if (!(instance instanceof Job)) {
        throw new Error(
          'Migration class must implement MigrationInterImplement',
        );
      }
      const basename = path.basename(file);
      const executed = await this.history.findOne({ name: basename });
      if (executed) {
        continue;
      }

      try {
        await this.db.exec('BEGIN TRANSACTION');
        await instance.up();
        await this.history.create({
          name: basename,
          content: JSON.stringify(instance.getExecSql()),
        });
        await this.db.exec('COMMIT');
      } catch (err) {
        await instance.down();
        await this.db.exec('ROLLBACK');
        throw err;
      }
    }
  }
}
