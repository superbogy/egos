import { getDriverByBucket } from '../lib/bucket';
import { column, connect, Model, table } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Driver from '@egos/storage/dist/abstract';
import Base from './base';
import fs from 'fs';
import { FileObject } from './file-object';

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
  order: Record<string, string>;
}

export interface FileSchema {
  id: number;
  type: string;
  fileId: number;
  parentId: number;
  isFolder: number;
  path: string;
  filename: string;
  size: number;
  description?: string;
  starred?: boolean;
  tag?: string[];
  createdAt: string;
  updatedAt: string;
}
@table('files')
export class FileModel extends Base {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.TEXT })
  type: string;
  @column({ type: FieldTypes.INT, default: '' })
  fileId: number;
  @column({ type: FieldTypes.INT, default: '' })
  parentId: number;
  @column({ type: FieldTypes.INT, default: '' })
  isFolder: number;
  @column({ type: FieldTypes.TEXT, default: '' })
  path: string;
  @column({ type: FieldTypes.TEXT, default: '' })
  filename: string;
  @column({ type: FieldTypes.TEXT, default: '' })
  size: number;
  @column({ type: FieldTypes.TEXT, default: '' })
  description: string;

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
      fileId: 0,
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

  async getFileInfo(item: any) {
    let file: FileModel = (await FileObject.findById(item.fileId)) as FileModel;
    const sizeLimit = 1024 * 1024 * 50;
    const driver = getDriverByBucket(file.bucket) as Driver;
    console.log('getFileInfo', file.bucket);
    const url = await driver.getUrl(file.remote);
    if (
      (file.type === 'image' || file.type === 'video') &&
      file.size < sizeLimit
    ) {
      if (!fs.existsSync(file.local)) {
        const cacheFile = await driver.getCacheFilePath(file);
        file.local = cacheFile;
        file = (await file.save()) as FileModel;
      }
    }
    return { ...item, url, file: file.toJSON() };
  }

  async getFiles({
    keyword,
    parentId,
    order,
    limit = 50,
    offset = 0,
  }: QueryPayload) {
    let parent: FileModel;
    if (!parentId) {
      parent = (await this.buildDefaultFolders()) as FileModel;
    } else {
      parent = (await this.findById(parentId)) as FileModel;
    }
    const where: { parentId: number; filename?: Record<string, string> } = {
      parentId: parent.id,
    };
    const options = {
      limit,
      offset,
      order: order || { id: 'desc' },
    };
    if (keyword) {
      where.filename = { $like: `%${keyword}%` };
    }
    const total = await this.count(where);
    const files = await this.find(where, options);
    const list = [];
    for (const item of files) {
      const file = item.toJSON();
      if (!item.isFolder) {
        const newItem = await this.getFileInfo(file);
        list.push(newItem);
        continue;
      }
      list.push(file);
    }
    // const inProgressNumber = await
    return { meta: { total }, data: { files: list, parent: parent.toJSON() } };
  }
}

export const File = new FileModel();
