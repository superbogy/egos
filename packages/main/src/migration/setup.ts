import { Album } from '../models';
import { Job } from '@egos/lite';
import { utils } from '@egos/lite';
import { File } from '../models/file';
import { FileObject } from '../models/file-object';

export default class SetupJob extends Job {
  async up() {
    const albumSql = utils.genSql(Album.table, Album.schema);
    await this.exec(albumSql);
    const fileSql = utils.genSql(File.table, File.schema);
    await this.exec(fileSql);
    const fileObjSql = utils.genSql(FileObject.table, FileObject.schema);
    await this.exec(fileObjSql);
  }
}
