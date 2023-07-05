import { Album, Favorite } from '../models';
import { Job } from '@egos/lite';
import { utils } from '@egos/lite';
import { File } from '../models/file';
import { FileObject } from '../models/file-object';
import { Task } from '../models/task';
import { Tag } from '../models/tag';
import { Share } from '../models/share';

export default class SetupJob extends Job {
  async up() {
    const albumSql = utils.genSql(Album.table, Album.schema);
    console.log('>>>>>>--3', albumSql);
    await this.exec(albumSql);
    const fileSql = utils.genSql(File.table, File.schema);
    await this.exec(fileSql);
    const fileObjSql = utils.genSql(FileObject.table, FileObject.schema);
    await this.exec(fileObjSql);
    const taskSql = utils.genSql(Task.table, Task.schema);
    await this.exec(taskSql);
    const tagSql = utils.genSql(Tag.table, Tag.schema);
    await this.exec(tagSql);
    const favoriteSql = utils.genSql(Favorite.table, Favorite.schema);
    await this.exec(favoriteSql);
    const shareSql = utils.genSql(Share.table, Share.schema);
    await this.exec(shareSql);
  }
}
