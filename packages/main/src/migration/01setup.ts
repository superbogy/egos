import { Album, Favorite, Photo } from '../models';
import { Job } from '@egos/lite';
import { utils } from '@egos/lite';
import { File } from '../models/file';
import { FileObject } from '../models/file-object';
import { Task } from '../models/task';
import { Tag } from '../models/tag';
import { Share } from '../models/share';
import { TagMap } from '../models/tag-source';

export default class SetupJob extends Job {
  async up() {
    console.log('>>>>>>12');
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
    const tagMapSql = utils.genSql(TagMap.table, TagMap.schema);
    await this.exec(tagMapSql);
    const albumSql = utils.genSql(Album.table, Album.schema);
    await this.exec(albumSql);
    const photoSql = utils.genSql(Photo.table, Photo.schema);
    console.log(photoSql);
    await this.exec(photoSql);
  }
}
