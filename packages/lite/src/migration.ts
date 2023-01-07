import { Database } from 'sqlite';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { ColumnSchema, FieldTypes } from './schema';
import { column, table } from './decorators';
import { Model } from './model';
import { columnToSql, genSql } from './utils';

export abstract class MigrationInterImplement {
  private db: Database;
  public table: string;
  private executedSql: string[];
  async down(): Promise<void> {}
  async up(): Promise<void> {}

  addColumn(table: string, column: ColumnSchema) {
    const colSql = columnToSql(column);
    const sql = `ALTER TABLE \`${table}\` ADD ${colSql}`;
    this.db.exec(sql);
  }

  modifyColumn(table: string, column: ColumnSchema) {
    const colSql = columnToSql(column);
    const sql = `ALTER TABLE \`${table}\` MODIFY ${colSql}`;
    this.db.exec(sql);
  }

  dropColumn(table: string, column: string) {
    this.exec(`ALTER TABLE \`${table}\` DROP  \`${column}\``);
  }

  exec(sql: string) {
    this.executedSql.push(sql);
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
  tableName: string;
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
    this.history = new MigrationHistory();
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
      const { default: cls } = await import(path.resolve(file));
      const instance: MigrationInterImplement = new cls(this.db);
      if (!(instance instanceof MigrationInterImplement)) {
        throw new Error(
          'Migration class must implement MigrationInterImplement',
        );
      }
      const basename = path.basename(file);
      const executed = this.history.findOne({ name: basename });
      if (executed) {
        continue;
      }
      try {
        await instance.up();
        await this.history.create({
          name: basename,
          tableName: instance.table,
          content: JSON.stringify(instance.getExecSql()),
        });
      } catch (err) {
        await instance.down();
      }
    }
  }
}
