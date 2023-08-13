import {
  Builder,
  FindOpts,
  ORDER_TYPE,
  column,
  schema,
  table,
} from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';
import { Album } from './album';
import { FileObject } from './file-object';
import { getDriverByBucket } from '../lib/bucket';
import humanFormat from 'human-format';
import { ServiceError } from '../error';
import { TagMap } from './tag-source';
import { Tag } from './tag';

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
  @column({ type: FieldTypes.TEXT })
  photoDate: string;
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
    } else {
      options.order = {
        photoDate: ORDER_TYPE.DESC,
        rank: ORDER_TYPE.DESC,
      };
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
    // const builder = new Builder(this.table);
    // const r = builder
    //   .LeftJoin(FileObject.table, { object_id: 'id' })
    //   .fields(['*'], Photo.table)
    //   .fields(['*'], FileObject.table)
    //   .where(Photo.toRowData(where))
    //   .select();
    // const rr = await Photo.query(r.sql, r.params);
    // console.log('rr------->', rr);
    const album = await Album.findByIdOrError(albumId);
    const photos = await this.find(where, options);
    const total = await this.count(where);
    const data = [];
    const ids: number[] = [];
    for (const item of photos) {
      ids.push(item.id);
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
    const tags = await Tag.getTagsWithSourceId(ids, 'photo');
    return {
      meta: {
        total,
        tags,
        album: album.toJSON(),
      },
      data,
    };
  }

  async setCover({ id }: { id: number }) {
    const photo = await Photo.findByIdOrError(id);
    const album = await Album.findByIdOrError(photo.albumId);
    await Album.update({ id: album.id }, { coverId: photo.objectId });
  }

  async removePhotos({ ids, albumId = 1 }: any) {
    const photos = await Photo.findByIds(ids);
    const album = await Album.findById(albumId);
    if (!album) {
      throw new ServiceError({ mesage: 'album not found' });
    }
    if (ids.includes(album.coverId)) {
      await Album.update({ id: albumId }, { cover: '' });
    }
    Promise.all(
      photos.map((media: any) => {
        return media.remove();
      }),
    );
    return true;
  }

  async move({ sourceId, targetId }: any) {
    const source = await Photo.findById(sourceId);
    const target = await Photo.findById(targetId);
    if (!source || !target) {
      return false;
    }
    await Photo.update(
      { id: sourceId },
      { rank: target.rank, photoDate: target.photoDate },
    );
    await Photo.update({ id: targetId }, { rank: source.rank });
    return true;
  }

  async moveToDay({ sourceId, day }: any) {
    if (!day) {
      return false;
    }
    const source = await Photo.findById(sourceId);
    if (!source) {
      return false;
    }
    const dayStr = new Date(day).toISOString();
    if (dayStr === source.photoDate) {
      return false;
    }
    await Photo.update({ id: sourceId }, { photoDate: dayStr });
    return true;
  }
}

export const Photo = new PhotoModel();
