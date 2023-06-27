import { Job } from '@egos/lite';
import { File } from '../models/file';
import { FieldTypes } from '@egos/lite/dist/schema';
import { jsonParser, jsonStringify } from '../lib/helper';
import { Task } from '../models';

export default class AlterJob extends Job {
  async up() {
    console.log('????1 alter');
    // await this.modifyColumn(File.table, {
    //   type:
    // })
    // await this.addColumn(Task.table, {
    //   type: FieldTypes.TEXT,
    //   name: 'created_at',
    //   default: '""',
    // });
    // await this.addColumn(Task.table, {
    //   type: FieldTypes.TEXT,
    //   name: 'updated_at',
    //   default: '""',
    // });
    // await this.addColumn(File.table, {
    //   type: FieldTypes.TEXT,
    //   name: 'tags',
    //   encode: jsonStringify,
    //   decode: jsonParser,
    //   default: '',
    // });
    // await this.addColumn(File.table, {
    //   type: FieldTypes.TEXT,
    //   name: 'password',
    //   default: '',
    // });
  }
}
