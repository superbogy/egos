import { FindOpts, ORDER_TYPE, column, schema, table } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';
import { Album } from './album';
import { ServiceError } from '../error';
import { Tag } from './tag';
import { RANK_STEP } from '../constants';
import { File } from './file';
import { Favorite } from './favorite';
import { Share } from './share';

export class PhotoSchema {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.INT })
  albumId: number;
  @column({ type: FieldTypes.INT })
  fileId: number;
  @column({ type: FieldTypes.REAL })
  rank: number;
  @column({ type: FieldTypes.TEXT })
  location: string;
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
        rank: ORDER_TYPE.DESC,
        photoDate: ORDER_TYPE.DESC,
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
    const album = await Album.findByIdOrError(albumId);
    const photos = await this.find(where, options);
    const total = await this.count(where);
    const data = [];
    const ids: number[] = [];
    for (const item of photos) {
      ids.push(item.id);
      const media = item.toJSON();
      const file = await File.getFileInfoById(item.fileId);
      if (!file) {
        await this.deleteById(item.id);
        continue;
      }
      // const driver = getDriverByBucket(file.bucket);
      // const url = await driver.getUrl(file.remote);
      // if (media.type === 'image') {
      //   if (!existsSync(media.local)) {
      //     console.log('123123');
      //     media.local = await driver.getCacheFile(media);
      //   }
      // }
      const starred = await Favorite.findOne({
        sourceId: item.id,
        type: 'photo',
      });
      const shared = await Share.findOne({
        sourceId: item.id,
        type: 'photo',
      });
      media.starred = !!starred;
      media.shared =
        shared && new Date(shared.expiredAt) > new Date() ? true : false;
      media.file = file;
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
    await Album.update({ id: album.id }, { coverId: photo.id });
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
    // const next = await Photo.findOne(
    //   { rank: { gt: target.rank } },
    //   { order: { rank: ORDER_TYPE.ASC } },
    // );
    await Photo.update(
      { id: sourceId },
      { rank: source.rank + RANK_STEP, photoDate: target.photoDate },
    );
    await Photo.update({ id: targetId }, { rank: source.rank });
    return true;
  }

  async moveToDay({ sourceId, day }: any) {
    if (!day) {
      return false;
    }
    const source = await this.findById(sourceId);
    if (!source) {
      return false;
    }
    const dayStr = new Date(day).toISOString();
    if (dayStr === source.photoDate) {
      return false;
    }
    const last = await this.findOne(
      { photoDate: day },
      { order: { rank: ORDER_TYPE.DESC } },
    );
    await this.update(
      { id: sourceId },
      { photoDate: dayStr, rank: last ? last.rank + 1 : 1 },
    );
    return true;
  }

  async getPhotoUrl(id: number) {
    const photo = await this.findById(id);
    if (!photo) {
      return '';
    }
    return File.getFileUrl(photo?.fileId);
  }

  async getFileObjectId(id: number) {
    const photo = await this.findById(id);
    if (!photo) {
      return;
    }
    const file = await File.findById(photo.fileId);
    return file?.objectId;
  }

  async rename(id: number, name: string) {
    const photo = await this.findById(id);
    if (!photo) {
      return false;
    }
    const file = await File.findByIdOrError(photo.fileId);
    file.filename = name;
    await file.save();
    return true;
  }

  async star(id: number) {
    return Favorite.star(id, 'photo');
  }
}

export const Photo = new PhotoModel();
