import { Job } from '@egos/lite';
import { File } from '../models/file';
import { FieldTypes } from '@egos/lite/dist/schema';
import { jsonParser, jsonStringify } from '../lib/helper';
import { Share, Task } from '../models';

export default class AlterJob extends Job {
  async up() {
    console.log('????2 alter');
    // await this.modifyColumn(File.table, {
    //   type:
    // })
    await this.addColumn(Share.table, {
      type: FieldTypes.INT,
      name: 'is_external',
      default: 0,
    });
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
