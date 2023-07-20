import { Job } from '@egos/lite';
import { File } from '../models/file';
import { FieldTypes } from '@egos/lite/dist/schema';
import { utils } from '@egos/lite';
import { Share, Task } from '../models';

export default class AlterJob extends Job {
  async up() {
    console.log('????22>>  alter');
    // await this.modifyColumn(File.table, {
    //   type:
    // })
    // await this.dropColumn(Task.table, 'sourceId');
    // await this.addColumn(Task.table, {
    //   name: 'source_id',
    //   type: FieldTypes.TEXT,
    //   default: '0',
    // });
    // await this.dropColumn(Task.table, 'payload');
    // await this.modifyColumn(File.table, {
    //   name: 'sourceId',
    //   type: FieldTypes.INT,
    //   default: 0,
    // });
    // await this.addColumn(Task.table, {
    //   type: FieldTypes.TEXT,
    //   name: 'payload',
    //   default: '{}',
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
