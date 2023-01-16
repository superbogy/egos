import { Album } from '../models';
import { Job } from '@egos/lite';
import { utils } from '@egos/lite';

export default class SetupJob extends Job {
  async up() {
    const tableSql = utils.genSql(Album.table, Album.schema);
    await this.exec(tableSql);
  }
}
