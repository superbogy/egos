import { column, connect, FindOpts, Model, table } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';
import { v4 as uuid } from 'uuid';
import { getDriverByBucket } from '../lib/bucket';
import { ServiceError } from '../error';
import { getIPAddress, getPort } from '../lib/helper';
import { Album } from './album';
import { File } from './file';
import { Photo } from './photo';
import { FileObject } from './file-object';

@table('shares')
class ShareModel extends Base {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.TEXT })
  sourceId: number;
  @column({ type: FieldTypes.TEXT, default: '' })
  type: string;
  @column({ type: FieldTypes.TEXT, default: '' })
  action: string;
  @column({ type: FieldTypes.TEXT, default: '' })
  token: string;
  @column({ name: 'is_external', type: FieldTypes.INT, default: 0 })
  isExternal: string;
  @column({ type: FieldTypes.TEXT, default: '' })
  expiredAt: string;

  async getShareBaseUrl() {
    const host = getIPAddress();
    const port = await getPort();
    return ['http://', host, `:${port}`].join('');
  }

  async genFileUploadUrl({ id, expiry }: { id: string; expiry: number }) {
    const source = await File.findById(id);
    if (!source) {
      return;
    }
    return this.genUploadUrl({ source, type: 'file', expiry });
  }

  async genAlbumUploadUrl({ id, expiry }: { id: string; expiry: number }) {
    const source = await Album.findById(id);
    if (!source) {
      return;
    }
    return this.genUploadUrl({ source, type: 'album', expiry });
  }
  async genUploadUrl({
    source,
    type,
    expiry,
  }: {
    source: Base;
    type: string;
    expiry: number;
  }) {
    if (!source) {
      throw new ServiceError({
        message: 'source not found',
      });
    }
    let shared = await this.findOne({
      sourceId: source.id,
      type,
      action: 'upload',
    });
    if (shared) {
      shared.expiredAt = new Date(Date.now() + expiry).toISOString();
      shared = await shared.save();
    } else {
      const token = uuid();
      const data = {
        type,
        token,
        isExternal: 0,
        sourceId: source.id,
        action: 'upload',
        expiredAt: new Date(Date.now() + expiry * 86400 * 1000),
      };
      shared = await this.create(data);
    }
    const baseUrl = await this.getShareBaseUrl();
    const url = `${baseUrl}/web#/uploader?token=${shared.token}&id=${shared.id}&type=${type}`;
    return { ...shared.toJSON(), url };
  }

  async shareFile({
    id,
    expiry,
    isExternal,
  }: {
    id: number;
    expiry: number;
    isExternal: boolean;
  }) {
    const source = await File.findById(id);
    if (!source) {
      return;
    }
    return this.shareByType({ source, expiry, isExternal, type: 'file' });
  }

  async shareAlbum({
    id,
    expiry,
    isExternal,
  }: {
    id: number;
    expiry: number;
    isExternal: boolean;
  }) {
    const source = await Album.findById(id);
    if (!source) {
      return;
    }
    return this.shareByType({ source, expiry, isExternal, type: 'album' });
  }

  async shareByType({
    source,
    expiry,
    isExternal,
    type,
  }: {
    source: Base;
    expiry: number;
    isExternal: boolean;
    type: string;
  }) {
    if (!source) {
      return;
    }
    const shared = await this.findOne({
      sourceId: source.id,
      type,
      action: 'view',
    });
    const expDays = (expiry || 1) * 86400 * 1000;
    if (shared) {
      shared.expiredAt = new Date(Date.now() + expDays).toISOString();
      const cur = await shared.save();
      const url = await this.getUrl(cur);
      return { ...cur.toJSON(), url };
    }
    const token = uuid();

    const data = {
      type,
      token,
      isExternal: isExternal ? 1 : 0,
      sourceId: source.id,
      expiredAt: new Date(Date.now() + expDays).toISOString(),
    };
    const share = await this.create(data);
    const url = await this.getUrl(share);
    return { ...share.toJSON(), url };
  }

  async getUrl(record: ShareModel) {
    const host = getIPAddress();
    const port = await getPort();
    const baseUrl = ['http://', host, `:${port}`].join('');
    const externalUrls = [];
    const defValue = { external: [], internal: [] };
    if (!['photo', 'file'].includes(record.type)) {
      return defValue;
    }
    if (record.isExternal) {
      const q =
        record.type === ''
          ? File.findById(record.sourceId)
          : Photo.findById(record.sourceId);
      const source = await q;
      if (!source) {
        return defValue;
      }
      const fileObj = await FileObject.findByIdOrError(source?.objectId);
      const backup = fileObj.backup;
      for (const item of backup) {
        const driver = getDriverByBucket(item.bucket);
        const externalUrl = await driver.getUrl(fileObj?.remote as string);
        externalUrls.push({
          bucket: item.bucket,
          url: externalUrl,
        });
      }
    }

    // if (record.type === 'album') {
    //   const interal =  `${baseUrl}/web#/album?token=${record.token}&id=${record.id}&type=${record.type}`;

    // }
    const internal = [
      {
        bucket: 'Local',
        url: `${baseUrl}/web#/share?token=${record.token}&id=${record.id}`,
      },
    ];

    return {
      external: externalUrls,
      internal,
    };
  }

  async getShareByFileId(fileId: string) {
    return this.getShareBySource(fileId, 'file');
  }
  async getShareBySource(sourceId: string, type: string) {
    const shared = await this.findOne({
      sourceId,
      type: type,
      action: 'view',
    });
    if (!shared) {
      return null;
    }
    const url = await this.getUrl(shared);
    return { ...shared.toJSON(), url: url };
  }

  async getAlbumUploadShareById(albumId: number) {
    const shared = await this.findOne({
      sourceId: albumId,
      type: 'album',
      action: 'upload',
    });
    if (!shared) {
      return null;
    }
    // const url = await this.getUrl(shared);
    const baseUrl = await this.getShareBaseUrl();
    const url = `${baseUrl}/web#/uploader?token=${shared.token}&id=${shared.id}&type=${shared.type}`;
    return { ...shared.toJSON(), url: url };
  }

  async getShareList({ type }: { type: string }, options?: FindOpts) {
    const where: Record<string, string> = {
      action: 'view',
    };
    if (type) {
      where.type = type;
    }
    const list = await this.find(where, options);
    const res = [];
    for (const item of list) {
      const url = await this.getUrl(item);
      res.push({ ...item.toJSON(), url });
    }

    return res;
  }
  async getUploader({
    id,
    token,
  }: {
    id: number;
    token: string;
    type: string;
  }) {
    const share = await this.findById(id);
    if (!share || share.token !== token) {
      throw new ServiceError({
        message: 'share not found',
      });
    }
    if (share.action !== 'upload') {
      throw new ServiceError({
        message: 'invalid share action',
      });
    }
    const model = share.type === 'file' ? File : Album;
    const source = await model.findById(share.sourceId);
    return { data: source, meta: { type: share.type } };
  }
}

export const Share = new ShareModel();
