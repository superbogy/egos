import { column, connect, Model, ORDER_TYPE, schema, table } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';
import { ServiceError } from '../error';

export class AlbumSchema {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.TEXT })
  name: string;
  @column({ type: FieldTypes.INT, default: '""' })
  rank: number;
  @column({ type: FieldTypes.INT, default: '""' })
  coverId: number;
  @column({ type: FieldTypes.TEXT, default: '""' })
  sortBy: string;
  @column({ type: FieldTypes.TEXT, default: '""' })
  description: number;
}

@table('albums')
@schema(AlbumSchema)
class AlbumModel extends Base {
  async createAlbum(data: Partial<AlbumSchema>) {
    if (!data.name) {
      throw new ServiceError({ message: 'name required' });
    }
    const last = await Album.findOne({}, { order: { rank: ORDER_TYPE.DESC } });
    const album = {
      name: data.name,
      description: data.description || '',
      rank: last ? last.rank + 1 : 1,
    };
    const res = await Album.insert(album);
    return res;
  }
}

export const Album = new AlbumModel();
