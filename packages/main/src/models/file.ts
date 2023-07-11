import { getDriverByBucket } from '../lib/bucket';
import { column, table, ORDER_TYPE, SelectOrder, schema } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Driver from '@egos/storage/dist/abstract';
import Base from './base';
import fs from 'fs';
import { FileObject } from './file-object';
import { jsonParser, jsonStringify } from '../lib/helper';
import { Tag } from './tag';
import R from 'ramda';
import { ServiceError } from '../error';
import { Task } from './task';
import { setTaskSecret } from '../jobs/helper';
import { md5 } from '@egos/storage';
import { Favorite } from './favorite';
import { Share } from './share';
import { TagMap } from './tag-source';

export const quickEntrance = [
  { filename: 'Document', path: '/Document' },
  { filename: 'Picture', path: '/Picture' },
  { filename: 'Movie', path: '/Movie' },
  { filename: 'Music', path: '/Music' },
  { filename: 'Application', path: '/Application' },
  { filename: 'Reference', path: '/Reference' },
];

export interface QueryPayload {
  keyword?: string;
  limit?: number;
  offset?: number;
  parentId?: number;
  order: SelectOrder;
}

export class FileSchema {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.TEXT })
  type: string;
  @column({ type: FieldTypes.INT, default: '""' })
  objectId: number;
  @column({ type: FieldTypes.INT, default: '""' })
  parentId: number;
  @column({ type: FieldTypes.INT, default: '""' })
  isFolder: number;
  @column({ type: FieldTypes.TEXT, default: '""' })
  path: string;
  @column({ type: FieldTypes.TEXT, default: '""' })
  filename: string;
  @column({ type: FieldTypes.TEXT, default: '""' })
  size: number;
  @column({ type: FieldTypes.TEXT, default: '""' })
  description: string;
  @column({
    type: FieldTypes.TEXT,
    default: '[]',
    encode: jsonStringify,
    decode: jsonParser,
  })
  tags: string[];
  @column({ type: FieldTypes.TEXT, default: '""' })
  password: string;
  @column({ type: FieldTypes.INT, default: 0 })
  isEncrypt: number;
  @column({ type: FieldTypes.TEXT, default: 'uploading' })
  status: string;
  @column({ type: FieldTypes.TEXT, default: '""' })
  local: string;
}

@table('files')
@schema(FileSchema)
export class FileModel extends Base {
  async buildDefaultFolders() {
    const isRoot = await this.findOne({ parentId: 0 });
    if (isRoot) {
      return isRoot;
    }
    // root folder
    const base = {
      parentId: 0,
      filename: 'root',
      path: '/',
      size: 0,
      type: 'folder',
      isFolder: 1,
      objectId: 0,
      description: '',
    };
    const root = await this.create(base);
    await Promise.all(
      quickEntrance.map((item: any) => {
        return this.create({ ...base, ...item, parentId: root.id });
      }),
    );
    return root;
  }

  async getQuickEntrance() {
    const root = await this.buildDefaultFolders();
    const where = {
      parentId: root.id,
      path: {
        $in: quickEntrance.map((item) => item.path),
      },
    };

    const folders = await this.find(where);
    folders.unshift(root);
    return folders;
  }

  async getFilePath(id: number) {
    const file = await this.findByIdOrError(id);
    const obj = await FileObject.findByIdOrError(file.objectId);
    const driver = getDriverByBucket(obj.bucket);
    return driver.getPath(obj.remote);
  }

  async getFileInfoById(id: number) {
    const file = await this.findByIdOrError(id);
    const info = await this.getFileInfo(file);
    return Object.assign({}, file.toJSON(), info);
  }

  async getFileInfo(item: this) {
    let file = await FileObject.findById(item.objectId);
    if (!file) {
      return;
    }
    const driver = getDriverByBucket(file.bucket) as Driver;
    const url = await driver.getUrl(file.remote);
    // const sizeLimit = 1024 * 1024 * 50;
    // if (
    //   (file.type === 'image' || file.type === 'video') &&
    //   file.size < sizeLimit
    // ) {
    //   if (!fs.existsSync(file.local)) {
    //     const cacheFile = await driver.getCacheFilePath(file);
    //     file.local = cacheFile;
    //     file = await file.save();
    //   }
    // }
    return { url, file: file.toJSON() };
  }

  async getFiles({
    keyword,
    parentId,
    order,
    limit = 50,
    offset = 0,
  }: QueryPayload) {
    let parent: any;
    if (!parentId) {
      parent = await this.buildDefaultFolders();
    } else {
      parent = await this.findById(parentId);
    }
    const where: { parentId: number; filename?: Record<string, string> } = {
      parentId: parent.id,
    };
    const options = {
      limit,
      offset,
      order: order || { id: ORDER_TYPE.DESC },
    };
    if (keyword) {
      where.filename = { $like: `%${keyword}%` };
    }
    const total = await this.count(where);
    const files = await this.find(where, options);
    const list = [];
    const sourceIds = files.map((f) => f.id);
    const starred = await Favorite.find({
      type: 'file',
      sourceId: { $in: sourceIds },
    });
    const starredIds = starred.map((item) => Number(item.sourceId));
    const shares = await Share.find({
      type: 'file',
      sourceId: { $in: sourceIds },
    });
    const shareIds = shares
      .filter((item) => new Date(item.expiredAt).getTime() > Date.now())
      .map((s) => Number(s.sourceId));
    for (const item of files) {
      const file = item.toJSON();
      const tagmaps = await TagMap.find({ sourceId: file.id, type: 'file' });
      const tags = await Tag.findByIds(tagmaps.map((item) => item.tagId));
      file.tags = tags.map((t) => t.toJSON());
      file.starred = starredIds.includes(file.id);
      file.shared = shareIds.includes(file.id);
      if (!item.isFolder) {
        const objectInfo = await this.getFileInfo(item);
        list.push({ ...file, ...objectInfo });
        continue;
      }
      list.push(file);
    }
    return {
      meta: { total },
      data: { files: list, parent: parent.toJSON() },
    };
  }

  async updateFileTags(id: number, tags: string[]) {
    const tagList = tags.map((tag) => tag.trim()).filter((i) => i);
    if (!tagList.length) {
      return;
    }
    const file = await this.findById(id);
    if (!file) {
      return;
    }

    return Promise.all(tagList.map((t) => Tag.findAndCreate(t, file.id)));
  }
  async crypto(fid: number, password: string, action: string) {
    const file = await this.findById(fid);
    if (!file) {
      throw new ServiceError({
        message: 'file  not found',
      });
    }
    file.status = 'uploading';
    await file.save();
    const task = {
      type: 'crypto',
      action,
      status: 'pending',
      sourceId: fid,
      maxRetry: 5,
      err: '',
    };
    const res = await Task.create(task);
    setTaskSecret(res.id, password);
  }

  async verify(id: number, password: string) {
    const file = await File.findById(id);
    if (!file) {
      throw new ServiceError({
        message: 'File not found',
        code: 10404,
      });
    }
    console.log('vvvvverify', file.password, md5(password));
    if (file.isEncrypt && file.password !== md5(password)) {
      throw new ServiceError({
        message: 'Password incorrect',
        code: 10401,
      });
    }
    return true;
  }
}

export const File = new FileModel();
