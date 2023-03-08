import { Job } from '@egos/lite';
import { File } from '../models/file';
import { FieldTypes } from '@egos/lite/dist/schema';
import { jsonParser, jsonStringify } from '../lib/helper';

export default class AlterJob extends Job {
  async up() {
    console.log('???? alter');
    await this.addColumn(File.table, {
      type: FieldTypes.TEXT,
      name: 'tags',
      encode: jsonStringify,
      decode: jsonParser,
      default: '',
    });
    await this.addColumn(File.table, {
      type: FieldTypes.TEXT,
      name: 'password',
      default: '',
    });
  }
}
