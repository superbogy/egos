import { Album } from '@/services/album';
import { Photo } from '@/services/photo';
import Share from '@/services/share';
import { message } from 'antd';
import { RcFile } from 'antd/lib/upload';
import * as albumService from '../service';

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
export const getShare = async ({ albumId }: { albumId: number }) => {
  return Share.getShareByAlbumId(albumId);
};
export const setCover = async ({ id }: { id: number }) => {
  const media = await Photo.findById(id);
  const album = await Album.findById(media.albumId);
  await Album.update({ id: album.id }, { cover: id });
};

export const removePhotos = async ({ ids, albumId = 1 }: any) => {
  const photos = await Photo.findByIds(ids);
  const album = await Album.findById(albumId);
  if (ids.includes(album.cover)) {
    await Album.update({ id: albumId }, { cover: '' });
  }
  photos.map((media: any) => {
    return media.remove();
  });
  return true;
};

export const move = async ({ sourceId, targetId }: any) => {
  const source = await Photo.findById(sourceId);
  const target = await Photo.findById(targetId);
  if (!source || !target) {
    message.error('Invalid Photo');
    return false;
  }
  console.log('move rank', source.rank, target.rank);
  await Photo.update({ id: sourceId }, { rank: target.rank });
  await Photo.update({ id: targetId }, { rank: source.rank });
  return true;
};

export const moveToDay = async ({ sourceId, day }: any) => {
  if (!day) {
    return false;
  }
  const source = await Photo.findById(sourceId);
  if (!source) {
    return false;
  }
  const dayStr = new Date(day).toISOString();
  const last = await Photo.findOne({
    albumId: source.albumId,
    shootAt: dayStr,
  });
  const rank = last ? last.rank + 1 : source.rank;
  await Photo.update({ id: sourceId }, { shootAt: dayStr, rank });
  return true;
};

export const searchPhoto = async (payload: any) => {
  const res = await Photo.searchPhoto(payload);
  return res;
};

export const genQrUpload = async ({ id, expiry }: any) => {
  return await Share.genAlbumUploadUrl({ id, expiry });
};
