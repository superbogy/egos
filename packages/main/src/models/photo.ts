import { FindOpts, ORDER_TYPE, column, schema, table } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';
import { Album } from './album';
import { FileObject } from './file-object';
import { getDriverByBucket } from '../lib/bucket';
import humanFormat from 'human-format';

export class PhotoSchema {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.TEXT })
  name: string;
  @column({ type: FieldTypes.INT })
  albumId: number;
  @column({ type: FieldTypes.INT })
  objectId: number;
  @column({ type: FieldTypes.INT })
  rank: number;
  @column({ type: FieldTypes.TEXT })
  location: string;
  @column({ type: FieldTypes.TEXT })
  description: number;
  @column({ type: FieldTypes.TEXT })
  status: string;
  @column({ type: FieldTypes.INT })
  isEncrypt: number;
  @column({ type: FieldTypes.TEXT })
  password: string;
  @column({ type: FieldTypes.TEXT })
  url: string;
}

interface PhotoSearchCondition {
  keyword: string;
  albumId: number;
  limit: number;
  offset: number;
  order: Record<string, ORDER_TYPE>;
  start: string;
  end: string;
}

@table('photos')
@schema(PhotoSchema)
class PhotoModel extends Base {
  async searchPhoto(q: PhotoSearchCondition) {
    const { keyword, albumId, limit = 50, offset = 0, order, start, end } = q;
    const where: Record<string, any> = {
      albumId,
    };
    const options: FindOpts = { limit, offset };
    if (keyword) {
      where.filename = { $like: `%${keyword}%` };
    }
    if (order) {
      options.order = order;
    }
    if (start) {
      where.updatedAt = { $gte: start };
    }
    if (end && end > start) {
      if (start) {
        where.updatedAt.$lte = end;
      } else {
        where.updatedAt = { $lte: end };
      }
    }
    const album = await Album.findByIdOrError(albumId);
    const photos = await this.find(where, options);
    const total = await this.count(where);
    const data = [];
    for (const item of photos) {
      const media = item.toJSON();
      const file = await FileObject.findById(item.objectId);
      if (!file) {
        await this.deleteById(item.id);
        continue;
      }
      const driver = getDriverByBucket(file.bucket);
      const url = await driver.getUrl(file.remote);
      // if (media.type === 'image') {
      //   if (!existsSync(media.local)) {
      //     console.log('123123');
      //     media.local = await driver.getCacheFile(media);
      //   }
      // }
      media.file = { ...file.toObject(), url, size: humanFormat(file.size) };
      data.push(media);
    }
    return {
      meta: {
        total,
        album: album.toJSON(),
      },
      data,
    };
  }
}

export const Photo = new PhotoModel();
