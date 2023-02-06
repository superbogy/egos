import { message } from 'antd';
import path from 'path';

import { ServiceError } from '@/lib/error';
import Model from '@/services/base';
import FileSystem from '@/services/file';
import Queue from '@/services/queue';
import Share from '@/services/share';
import Trash from '@/services/trash';

const Task = new Model('tasks');
const Favorite = new Model('favorite');

export const quickEntrance = [
  { filename: 'Document', path: '/Document' },
  { filename: 'Picture', path: '/Picture' },
  { filename: 'Movie', path: '/Movie' },
  { filename: 'Music', path: '/Music' },
  { filename: 'Application', path: '/Application' },
  { filename: 'Reference', path: '/Reference' },
];
const buildDefaultFolders = async (bucket) => {
  const isRoot = await FileSystem.findOne({ parentId: 0 });
  if (isRoot) {
    return isRoot;
  }
  const base = {
    parentId: 0,
    filename: 'All files',
    path: '/',
    size: 0,
    type: 'folder',
    isFolder: 1,
    fileId: 0,
    description: '',
  };
  const root = await FileSystem.create(base);
  await Promise.all(
    quickEntrance.map((item) => {
      return FileSystem.create({ ...base, ...item, parentId: root.id });
    }),
  );
  return root;
};

export const getQuickEntrance = async () => {
  const root = await buildDefaultFolders();
  const where = {
    parentId: root.id,
    path: {
      $in: quickEntrance.map((item) => item.path),
    },
  };

  const folders = await FileSystem.find(where);
  folders.unshift(root);
  return folders;
};

export const query = async (payload) => {
  const res = await FileSystem.getFiles(payload);
  return res;
};

export const upload = async ({ files, parentId }) => {
  await Queue.buildUploadTasks({ files, parentId });
  window.Electron.ipcRenderer.send('upload', { type: 'file' });
};

export const download = async ({ ids, local }) => {
  const { ipcRenderer } = window.Electron;
  await Queue.download({ ids, local, type: 'file' });
  return ipcRenderer.send('download', { type: 'file' });
};

export const openLocal = async ({ local }) => {
  window.ElectronApi.ipcRenderer.send('openFile', { local });
};

export const moveToTrash = async ({ ids }) => {
  const records = await FileSystem.findByIds(ids);
  for (const record of records) {
    const trash = {
      type: 'file-systems',
      payload: record,
      expiredAt: Date.now() + 86400 * 30,
    };
    await Trash.create(trash);
    await FileSystem.deleteById(record.id);
  }

  return true;
};

export const createFolder = async ({ name, parentId = 0 }) => {
  const pathItem = ['/'];
  if (parentId) {
    const parent = await FileSystem.findById(parentId);
    if (!parent) {
      throw new ServiceError({
        message: 'parent not found',
        code: 11404,
      });
    }
    pathItem.push(parent.path);
  } else {
    const parent = await FileSystem.findOne({ parentId: 0 });
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
    fileId: 0,
    description: '',
  };
  return Promise.resolve(FileSystem.create(data));
};

export const getFolderByPath = async (payload) => {
  const where = {
    path: payload.path,
  };
  const folder = await FileSystem.findOne(where);
  return folder || null;
};

const moveSingle = async (sourceId, targetId) => {
  const source = await FileSystem.findById(sourceId);
  if (!source) {
    return false;
  }
  const target = await FileSystem.findById(targetId);
  if (!target || !target.isFolder) {
    message.error('Target folder not found');
    return false;
  }
  const newTarget = await FileSystem.update(
    { id: sourceId },
    { parentId: targetId, path: path.join(target.path, source.filename) },
  );
  if (newTarget.isFolder) {
    const files = await FileSystem.find({ parentId: source.id });
    files.map((item) => {
      return moveSingle(item.id, newTarget);
    });
  }
  return true;
};

export const move = async ({ targetId, sourceIds }) => {
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
    message.error(err.message);
    return false;
  }
};

export const searchFolders = async ({ name }) => {
  return FileSystem.find(
    { path: { $like: `%${name}%` }, isFolder: 1 },
    { limit: 25, order: { path: 'asc' } },
  );
};

export const save = async (data) => {
  if (!data.id) {
    return message.error('invalid request');
  }
  const current = await FileSystem.findById(data.id);
  if (!current) {
    return message.error('file not found');
  }
  const change = {};
  Object.entries(data).forEach(([key, value]) => {
    if (current[key] !== undefined) {
      change[key] = value;
    }
  });
  await FileSystem.update({ id: current.id }, change);
  const needUpdateChild = current.parentId !== data.parentId;
  if (current.isFolder && needUpdateChild) {
    const children = await FileSystem.find({ parentId: current.id });
    children.map((child) => {
      return child.save();
    });
  }
};

export const rename = async ({ id, name }) => {
  const current = await FileSystem.findById(id);
  if (!current) {
    return null;
  }
  return await FileSystem.update({ id }, { filename: name });
};

export const transmission = async ({ status, action }) => {
  const where = { type: 'file' };
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

export const progressTaskNumber = async ({ action }) => {
  const where = {
    type: 'file',
    status: { $in: ['pending', 'processing'] },
  };
  if (action) {
    where.action = action;
  }
  const total = await Task.count(where);
  return total;
};

export const star = async ({ id }) => {
  const source = await FileSystem.findById(id);
  if (!source || source.starred) {
    return;
  }
  const data = {
    sourceId: id,
    type: 'type',
    isFolder: source.isFolder,
    filename: source.filename,
  };
  await FileSystem.update({ id: source.id }, { starred: 1 });
  await Favorite.create(data);
};

export const share = async ({ id, expiry, isExternal }) => {
  return Share.shareFile({ id, expiry, isExternal });
};

export const getShare = async ({ id }) => {
  return await Share.getShareByFileId(id);
};

export const genQrUpload = async ({ id, expiry }) => {
  return await Share.genFileUploadUrl({ id, expiry });
};
