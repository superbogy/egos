import { Database } from 'sqlite';
import { Model, connect, table, column } from '../../src';
import path from 'path';
import assert from 'assert';
import { FieldTypes, merge } from '../../src/schema';
import 'reflect-metadata';
import { genSql } from '../../src/utils';
import { Job } from '../../src/migration';

@connect('default')
@table('m_users')
class User extends Model {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.TEXT, default: '' })
  name: string;
  @column({ type: FieldTypes.INT, default: () => 'A' })
  age: number;
  @column({ type: FieldTypes.INT })
  gender: string;
  @column({ type: FieldTypes.TEXT }) mail: string;
  @column({ type: FieldTypes.TEXT, decode: JSON.parse, encode: JSON.stringify })
  profile: string;
}
export default class UserJob extends Job {
  async up() {
    const user = new User();
    console.log('uuuuuuu', user);
    await this.dropTable(user.table);
    console.log('11111', genSql(user.table, user.schema));
    await this.exec(genSql(user.table, user.schema));
    await this.addColumn(user.table, {
      name: 'user_age',
      type: FieldTypes.INT,
      default: () => 'A',
    });

    // await this.modifyColumn(user.table, {
    //   name: 'user_age',
    //   type: FieldTypes.INT,
    //   default: '0',
    // });
    await this.renameColumn(user.table, 'user_age', 'user_phone');
    await this.dropColumn(user.table, 'user_phone');
  }

  async down() {}
}
