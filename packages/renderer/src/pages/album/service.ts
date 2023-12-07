import { message } from 'antd';

import { Album } from '@/services/album';
import Share from '@/services/share';
import { Task } from '@/services/task';
import { Remote } from '@/lib/remote';

export interface AlbumQuery {
  name?: string;
  order?: any;
}
export interface Pagination {
  offset?: number;
  limit?: number;
}

export const fetchAlbums = async (
  query: AlbumQuery = {},
  page: Pagination = {},
) => {
  const res = await Album.fetchAlbums(query, page);
  // const { name, order } = query;
  // const { offset = 0, limit = 25 } = page;
  // const where: Record<string, any> = {};
  // const options = {
  //   order: order || { rank: 'desc' },
  //   offset,
  //   limit,
  // };
  // if (name) {
  //   where.name = { $like: `%${name}%` };
  // }
  // const albums = await Album.find(where, options);
  // const res = await Promise.all(
  //   albums.map(async (item: any) => {
  //     const data = item;
  //     if (item.cover) {
  //       const photo = await Photo.findById(item.cover);
  //       if (photo) {
  //         data.cover = photo.local;
  //       } else {
  //         data.cover = '';
  //       }
  //     } else {
  //       data.cover = '';
  //     }

  //     return data;
  //   }),
  // );
  // Remote.Electron.ipcRenderer.send('image:upload:start', { type: 'image' });
  return res;
};

export const createAlbum = async (data: Record<string, string>) => {
  return Album.createAlbum(data);
};

export const rename = async ({ name, id }: { name: string; id: number }) => {
  if (!name) {
    return false;
  }
  const current = await Album.findById(id);
  if (!current) {
    message.error('album not found');
    return false;
  }
  await Album.update({ id: current.id }, { name });
  return true;
};

export const move = async ({
  sourceId,
  targetId,
}: {
  sourceId: number;
  targetId: number;
}) => {
  const source = await Album.findById(sourceId);
  const target = await Album.findById(targetId);
  if (!source || !target) {
    message.error('Invalid album');
    return false;
  }
  await Album.update({ id: sourceId }, { rank: target.rank });
  await Album.update({ id: targetId }, { rank: source.rank });
};

export const search = async ({ keyword }: { keyword: string }) => {
  const where = {
    name: { $like: `%${keyword}%` },
  };
  const res = await Album.find(where, { limit: 25 });
  return res;
};

export const upload = async (payload: any) => {
  const { files, albumId } = payload;
  await Task.buildImageUploadTasks({ files, albumId });
  const { ipcRenderer } = Remote.Electron;
  return ipcRenderer.send('image:upload:start', { type: 'image' });
};

// export const loadBuckets = async () => getBuckets({ type: 'public' });

export const getPendingUpload = async () => {
  // const tasks = await Queue.find(
  //   { type: 'photo', action: 'upload', status: 'pending' },
  //   { limit: 50 },
  // );
  // const res = [];
  // for (const item of tasks) {
  //   const { payload } = item;
  //   if (!payload && typeof payload !== 'object') {
  //     await Queue.deleteById(item.id);
  //     continue;
  //   }
  //   res.push(payload);
  // }
  // return res;
  return Task.getPendingUpload();
};

export const share = async ({
  id,
  expiry,
  isExternal,
}: {
  id: number;
  expiry: number;
  isExternal: boolean;
}) => {
  return Share.shareAlbum({ id, expiry, isExternal });
};

export const getShare = async ({ id }: { id: number }) => {
  return await Share.getShareBySource(id, 'album');
};

export const download = async ({ albumId }: { albumId: number }) => {
  return Task.buildAlbumDownloadTask({ albumId });
};

export const star = async (ids: number[]) => {
  return Album.star({ ids });
};
