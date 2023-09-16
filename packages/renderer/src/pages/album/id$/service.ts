import { Album } from '@/services/album';
import { Photo, PhotoSchema } from '@/services/photo';
import Share from '@/services/share';
import { RcFile } from 'antd/lib/upload';
import * as albumService from '../service';
import { Remote } from '@/lib/remote';
import { Task } from '@/services/task';
import { dayMs } from '@/lib/helper';

export const fetchPhoto = async ({ albumId }: { albumId: number }) => {
  const album = await Album.findById(albumId);
  const list = await Photo.find({ albumId }, { order: { rank: 'asc' } });
  return {
    meta: {
      total: 1024,
      album,
    },
    data: list,
  };
};

export const photoUpload = async (params: {
  files: RcFile[];
  albumId: number;
}) => {
  console.log('in album upload', params);
  albumService.upload(params);
};

export const photoUpdate = async ({
  id,
  ...params
}: { id: string } & Partial<PhotoSchema>) => {
  return Photo.update({ id }, params);
};

export const rename = async (id: number, name: string) => {
  return Photo.rename(id, name);
};
export const getShare = async ({ albumId }: { albumId: number }) => {
  return Share.getShareByAlbumId(albumId);
};
export const setCover = async ({ id }: { id: number }) => {
  const photo = await Photo.findById(id);
  const album = await Album.findById(photo.albumId);
  await Album.update({ id: album.id }, { coverId: photo.id });
};

export const removePhotos = async ({ ids, albumId = 1 }: any) => {
  return Photo.removePhotos({ ids, albumId });
};

export const move = async ({ sourceId, targetId }: any) => {
  return Photo.move({ sourceId, targetId });
};

export const moveToDay = async ({ sourceId, day }: any) => {
  return Photo.moveToDay({ sourceId, day });
};

export const searchPhoto = async (payload: any) => {
  const res = await Photo.searchPhoto(payload);
  return res;
};

export const genQrUpload = async ({ id, expiry }: any) => {
  return await Share.genAlbumUploadUrl({ id, expiry });
};

export const download = async ({ ids }: { ids: number[] }) => {
  const { ipcRenderer } = Remote.Electron;
  await Task.download({ ids, type: 'image' });
  return ipcRenderer.send('image:download:start', { type: 'image' });
};

export const star = async (id: number) => {
  return Photo.star(id);
};

export const share = async ({
  ids,
  expiry,
  isExternal,
}: {
  ids: number[];
  expiry?: number;
  isExternal?: boolean;
}) => {
  const ttl = expiry || dayMs;
  const external = isExternal || false;
  return Share.sharePhotos({ ids, expiry: ttl, isExternal: external });
};
