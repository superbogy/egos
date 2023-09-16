import { column, ORDER_TYPE, schema, table } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';
import { ServiceError } from '../error';
import { Photo } from './photo';
import { AlbumQuery, Pagination } from '../interface';

export class AlbumSchema {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.TEXT })
  name: string;
  @column({ type: FieldTypes.INT, default: '' })
  rank: number;
  @column({ type: FieldTypes.INT, default: 0 })
  coverId: number;
  @column({ type: FieldTypes.TEXT, default: 0 })
  sortBy: string;
  @column({ type: FieldTypes.TEXT, default: '' })
  description: number;
}

@table('albums')
@schema(AlbumSchema)
class AlbumModel extends Base {
  fetchAlbums = async (query: AlbumQuery = {}, page: Pagination = {}) => {
    const { name, order } = query;
    const { offset = 0, limit = 25 } = page;
    const where: Record<string, any> = {};
    const options = {
      order: order || { rank: 'desc' },
      offset,
      limit,
    };
    if (name) {
      where.name = { $like: `%${name}%` };
    }
    const albums = await this.find(where, options);
    const res = await Promise.all(
      albums.map(async (item: any) => {
        const data = item.toJSON();
        if (item.coverId) {
          data.objectId = await Photo.getFileObjectId(item.coverId);
        } else {
          data.objectId = '';
        }
        return data;
      }),
    );
    return res;
  };
  async createAlbum(data: Partial<AlbumSchema>) {
    if (!data.name) {
      throw new ServiceError({ message: 'name required' });
    }
    const last = await Album.findOne({}, { order: { rank: ORDER_TYPE.DESC } });
    const album = {
      name: data.name,
      description: data.description || '',
      rank: last ? last.rank + 1 : 1,
      coverId: 0,
    };
    const res = await Album.insert(album);
    return res;
  }
}

export const Album = new AlbumModel();
