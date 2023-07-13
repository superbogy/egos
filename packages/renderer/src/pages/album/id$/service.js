import { Album } from '@/services/album';
import { Photo } from '@/services/photo';
import Share from '@/services/share';
import { message } from 'antd';

export const fetchPhoto = async ({ albumId }) => {
  const album = await Album.findById(albumId);
  const list = await Photo.find({ albumId }, { order: { rank: 'asc' } });
  const photos = [];
  for (const media of list) {
    if (media.type === 'image') {
      media.local = await Photo.getLocalCache(media);
    }
    media.url = await Photo.getMediaUrl(media);
    photos.push(media);
  }
  return {
    meta: {
      total: 1024,
      album,
    },
    data: photos,
  };
};

export const photoUpload = async (params) => {
  const { files, albumId } = params;
  for (const file of files) {
    await Photo.task({ file, albumId });
  }
  window.ElectronApi.send('upload', { type: 'photo' });
};

export const setCover = async ({ id }) => {
  const media = await Photo.findById(id);
  const album = await Album.findById(media.albumId);
  await Album.update({ id: album.id }, { cover: id });
};

export const removePhotos = async ({ ids, albumId = 1 }) => {
  const photos = await Photo.findByIds(ids);
  const album = await Album.findById(albumId);
  if (ids.includes(album.cover)) {
    await Album.update({ id: albumId }, { cover: '' });
  }
  photos.map((media) => {
    return media.remove();
  });
  return true;
};

export const move = async ({ sourceId, targetId }) => {
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

export const moveToDay = async ({ sourceId, day }) => {
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

export const searchPhoto = async (payload) => {
  const res = await Photo.searchPhoto(payload);
  return res;
};

export const genQrUpload = async ({ id, expiry }) => {
  return await Share.genAlbumUploadUrl({ id, expiry });
};
