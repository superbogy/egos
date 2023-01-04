import sqlite3 from 'sqlite3';
import { open, Database, ISqlite } from 'sqlite';
import Debug from 'debug';

const debug = Debug('@egos/lite');

export default class DB {
  static instances: { [key: string]: DB } = {};
  db: Database;
  connecting: any;
  debug: boolean;
  private constructor({
    connection,
    debug = false,
  }: {
    connection: Promise<Database>;
    debug: boolean;
  }) {
    this.db = null;
    this.debug = debug;
    this.connecting = connection;
  }

  async connect(): Promise<Database> {
    if (this.connecting) {
      this.db = await this.connecting;
      this.connecting = null;
    }
    return this.db;
  }
  static getInstance({
    filename,
    options,
    debug = false,
  }: {
    filename: string;
    options: Partial<ISqlite.Config>;
    debug?: boolean;
  }): DB {
    if (DB.instances[filename]) {
      return DB.instances[filename];
    }
    const connection = open({
      filename,
      driver: sqlite3.cached.Database,
      ...options,
    });
    DB.instances[filename] = new DB({ connection, debug });
    return DB.instances[filename];
  }

  async exec(sql: string): Promise<void> {
    await this.connect();
    return this.db.exec(sql);
  }

  async call(method: string, sql, params): Promise<any> {
    await this.connect();
    if (this.debug) {
      debug('exec sql: %s %j', sql, params);
    }
    const stmt = await this.db.prepare(sql);
    return stmt[method](params);
  }
}
