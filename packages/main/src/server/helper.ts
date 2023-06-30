import qs from 'query-string';
import { ServiceError } from '../error';
import { getIPAddress, getPort } from '../lib/helper';
import { Album, File, Share, Photo, FileObject } from '../models';

export const getShareFileObj = async ({
  shareId,
  sourceId,
  type = 'file',
  token,
}: {
  shareId: number;
  sourceId: number;
  type: string;
  token: string;
}) => {
  const share = await Share.findById(shareId);
  if (!share || share.token !== token) {
    throw new ServiceError({ message: 'share not found' });
  }
  console.log('>>>>>>>', share.expiredAt);
  if (new Date(share.expiredAt).getTime() < Date.now()) {
    throw new ServiceError({ message: 'share expired' });
  }
  let source = null;
  if (type === 'file') {
    const delegate = await checkDelegate({
      targetId: share.sourceId,
      currentId: sourceId,
    });
    if (!delegate) {
      throw new ServiceError({ message: 'invalid file' });
    }
    source = await File.findById(sourceId);
  } else {
    const available = checkPhoto({
      targetId: share.sourceId,
      currentId: sourceId,
    });
    if (!available) {
      throw new ServiceError({ message: 'invalid image' });
    }
    source = await Photo.findById(sourceId);
  }
  if (!source) {
    throw new ServiceError({ message: 'source not found' });
  }
  const file = await FileObject.findById(source.objectId);
  if (!file) {
    throw new ServiceError({ message: 'file not found' });
  }
  return file;
};

export const checkDelegate = async ({
  targetId,
  currentId,
}: {
  targetId: number;
  currentId: number;
}): Promise<boolean> => {
  if (targetId === currentId) {
    return true;
  }
  const current = await File.findById(currentId);
  if (!current) {
    return false;
  }
  console.log(
    'ppppppcccccc',
    current.parentId === targetId,
    typeof current.parentId,
    typeof targetId,
  );
  if (current.parentId === Number(targetId)) {
    return true;
  }
  return checkDelegate({ targetId, currentId: current.parentId });
};

export const checkPhoto = async ({ currentId, targetId }: any) => {
  const photo = await Photo.findById(currentId);
  if (!photo) {
    return false;
  }
  const album = await Album.findById(photo.albumId);
  if (!album) {
    return false;
  }
  return album.id === targetId;
};

export const getFileUrl = async ({ sourceId, shareId, token, type }: any) => {
  const host = getIPAddress();
  const port = await getPort();
  const q = qs.stringify({
    token,
    sourceId,
    type,
  });
  const baseUrl = `http://${host}:${port}/files`;
  const url = [baseUrl, `/${shareId}`, `?${q}`].join('');
  return url;
};
