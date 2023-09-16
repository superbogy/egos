import { Job } from '@egos/lite';
import { File } from '../models/file';
import { FieldTypes } from '@egos/lite/dist/schema';
import { utils } from '@egos/lite';
import { Photo, Share, Task } from '../models';

export default class AlterJob extends Job {
  async up() {
    // console.log('????22>  alter');
    // await this.modifyColumn(File.table, {
    //   type:
    // })
    // await this.dropColumn(Task.table, 'sourceId');
    // await this.addColumn(Photo.table, {
    //   name: 'photo_date',
    //   type: FieldTypes.TEXT,
    //   default: '',
    // });
    // await this.addColumn(Photo.table, {
    //   name: 'shooted_at',
    //   type: FieldTypes.TEXT,
    //   default: '',
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
