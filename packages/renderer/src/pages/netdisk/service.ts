import { message } from 'antd';
import path from 'path';

import { ServiceError } from '@/lib/error';
import Model from '@/services/base';
import File from '@/services/file';
import { Task } from '@/services/task';
import Share from '@/services/share';
// import Trash from '@/services/trash';
import { Remote } from '@/lib/remote';
import { Tag } from '@/services/tag';

const Favorite = new Model('favorites');

export const quickEntrance = [
  { filename: 'Document', path: '/Document' },
  { filename: 'Picture', path: '/Picture' },
  { filename: 'Movie', path: '/Movie' },
  { filename: 'Music', path: '/Music' },
  { filename: 'Application', path: '/Application' },
  { filename: 'Reference', path: '/Reference' },
];
export const buildDefaultFolders = async () => {
  return File.buildDefaultFolders();
};

export const getQuickEntrance = async () => {
  return File.getQuickEntrance();
};

export interface QueryInterface {
  order?: any;
  keyword?: string;
  parentId?: number;
  offset?: number;
  limit?: number;
}

export const query = async (payload: QueryInterface) => {
  const res = await File.getFiles(payload || {});
  Remote.Electron.ipcRenderer.send('file:upload:start', { type: 'file' });
  Remote.Electron.ipcRenderer.send('file:download:start', { type: 'file' });
  console.log('get file sss', res);
  return res;
};

export const getTags = async () => {
  return Tag.find({}, { limit: 10 });
};

export const upload = async ({
  files,
  parentId,
}: {
  files: string[];
  parentId: number;
}) => {
  await Task.buildUploadTasks({ files, parentId });
  Remote.Electron.ipcRenderer.send('file:upload:start', { type: 'file' });
};

export const download = async ({ ids }: { ids: number[] }) => {
  const { ipcRenderer } = Remote.Electron;
  await Task.download({ ids, type: 'file' });
  return ipcRenderer.send('file:download:start', { type: 'file' });
};

export const openLocal = async ({ local }: { local: string }) => {
  Remote.Electron.ipcRenderer.send('openFile', { local });
};

export const moveToTrash = async ({ ids }: { ids: number[] }) => {
  console.log('move to Trash,', ids);
  const records = await File.findByIds(ids);
  for (const record of records) {
    // const trash = {
    //   type: 'file',
    //   payload: record,
    //   expiredAt: Date.now() + 86400 * 30,
    // };
    // await Trash.create(trash);
    await File.deleteById(record.id);
  }

  return true;
};

export const createFolder = async ({
  name,
  parentId = 0,
}: {
  name: string;
  parentId: number;
}) => {
  const pathItem = ['/'];
  if (parentId) {
    const parent = await File.findById(parentId);
    if (!parent) {
      throw new ServiceError('parent not found', {
        code: 11404,
      });
    }
    pathItem.push(parent.path);
  } else {
    const parent = await File.findOne({ parentId: 0 });
    /* eslint-disable */
    parentId = parent.id;
  }
  pathItem.push(name);
  const data = {
    parentId,
    filename: name,
    path: path.join(...pathItem),
    size: 0,
    type: 'folder',
    isFolder: 1,
    objectId: 0,
    description: '',
  };
  return Promise.resolve(File.create(data));
};

export const getFolderByPath = async (payload: { path: string }) => {
  const where = {
    path: payload.path,
  };
  const folder = await File.findOne(where);
  return folder || null;
};

const moveSingle = async (sourceId: number, targetId: number) => {
  const source = await File.findById(sourceId);
  if (!source) {
    return false;
  }
  const target = await File.findById(targetId);
  if (!target || !target.isFolder) {
    message.error('Target folder not found');
    return false;
  }
  const newTarget = await File.update(
    { id: sourceId },
    { parentId: targetId, path: path.join(target.path, source.filename) },
  );
  if (newTarget.isFolder) {
    const files = await File.find({ parentId: source.id });
    files.map((item: { id: number }) => {
      return moveSingle(item.id, newTarget);
    });
  }
  return true;
};

export const move = async ({
  targetId,
  sourceIds,
}: {
  targetId: number;
  sourceIds: number[];
}) => {
  /* eslint-disable no-param-reassign */
  try {
    if (!sourceIds.length) {
      return false;
    }
    await Promise.all(
      sourceIds.map(async (itemId) => {
        return moveSingle(itemId, targetId);
      }),
    );
    return true;
  } catch (err) {
    message.error((err as Error).message);
    return false;
  }
};

export const searchFolders = async ({ name }: { name: string }) => {
  return File.find(
    { path: { $like: `%${name}%` }, isFolder: 1 },
    { limit: 25, order: { path: 'asc' } },
  );
};

export const save = async (data: Record<string, any>) => {
  if (!data.id) {
    return message.error('invalid request');
  }
  const current = await File.findById(data.id);
  if (!current) {
    return message.error('file not found');
  }
  const change: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (current[key] !== undefined && key !== 'id') {
      change[key] = value;
    }
  });
  await File.update({ id: current.id }, change);
  const needUpdateChild = current.parentId !== data.parentId;
  if (current.isFolder && needUpdateChild) {
    const children = await File.find({ parentId: current.id });
    children.map((child: any) => {
      return child.save();
    });
  }
};

export const rename = async ({ id, name }: { id: number; name: string }) => {
  const current = await File.findById(id);
  if (!current) {
    return null;
  }
  return await File.update({ id }, { filename: name });
};

export const transmission = async ({
  status,
  action,
}: {
  status: string;
  action: string;
}) => {
  const where: Record<string, any> = { type: 'file' };
  if (status) {
    where.status = status;
  }
  if (action) {
    where.action = action;
  }
  const total = await Task.count(where);
  const list = await Task.find(where, { limit: 50, order: { id: 'DESC' } });
  return { total, list };
};

export const progressTaskNumber = async ({
  action,
}: {
  action: string;
}): Promise<number> => {
  const where: Record<string, any> = {
    type: 'file',
    status: { $in: ['pending', 'processing'] },
  };
  if (action) {
    where.action = action;
  }
  const total = await Task.count(where);
  return total;
};

export const star = async ({ ids }: { ids: number[] }) => {
  for (const id of ids) {
    const source = await File.findById(id);
    if (!source) {
      return;
    }
    const data = {
      sourceId: id,
      type: 'file',
    };
    await Favorite.create(data);
  }
};

export const share = async ({
  id,
  expiry,
  isExternal,
}: {
  id: number;
  expiry: number;
  isExternal: 0 | 1;
}) => {
  return Share.shareFile({ id, expiry, isExternal });
};

export const getShare = async ({ id }: { id: number }) => {
  return await Share.getShareByFileId(id);
};

export const genQrUpload = async ({
  id,
  expiry,
}: {
  id: number;
  expiry: number;
}) => {
  return await Share.genFileUploadUrl({ id, expiry });
};

export const updateFileTags = (payload: { id: number; tags: string[] }) => {
  const { id, tags } = payload;
  return File.updateFileTags(id, tags);
};

export const verify = async (id: number, password: string) => {
  await File.verify(id, password);
};

export const crypto = async (payload: {
  id: number;
  password: string;
  type: string;
}) => {
  try {
    const { id, password, type } = payload;
    if (type === 'decrypt') {
      await verify(id, password);
    }
    await File.crypto(id, password, type);
    Remote.Electron.ipcRenderer.send('file:upload:start', { type: 'file' });
  } catch (err) {
    console.log(err);
    message.error((err as Error).message);
  }
};

export const searchTags = (name: string) => {
  return Tag.searchTags(name);
};
