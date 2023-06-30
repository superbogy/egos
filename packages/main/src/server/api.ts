import { Application, Router } from 'express';
import { Album, File, FileObject, Photo, Share } from '../models';
import { getFileUrl, getShareFileObj } from './helper';
import { ORDER_TYPE } from '@egos/lite';

const getShareChildren = async (
  share: any,
  parentIds: number[] | string[],
  options?: Record<string, any>,
) => {
  const lastId = parentIds[parentIds.length - 1];
  const result: { data: any[]; total: number } = { data: [], total: 0 };
  const current = await File.findById(lastId);
  console.log(parentIds, current);
  if (!current || !current.isFolder) {
    return result;
  }
  const parents = await File.findByIds(parentIds as number[]);
  const first = parents[0];
  if (first.id !== Number(share.sourceId)) {
    return result;
  }
  if (parents.length > 1) {
    for (let i = 0; i < parents.length - 1; i++) {
      const item = parents[i];
      const child = parents[i + 1];
      if (item.id !== child.parentId) {
        return result;
      }
    }
  }

  const data = await File.find({ parentId: current.id }, options);
  result.data = data.map((item) => {
    return { ...item.toJSON(), expiredAt: share.expiredAt };
  });
  result.total = await File.count({ parentId: current.id });
  return result;
};

export default (app: Router) => {
  app.get('/share', async (req, res) => {
    const { token, expand, pageSize, parentIds, id } = req.query as any;
    const share = await Share.findById(id);
    if (!share) {
      return res.status(404).json({
        error: {
          message: 'Not found',
        },
      });
    }
    if (share.token !== token) {
      return res.status(403).json({
        error: {
          message: 'Invalid token',
        },
      });
    }
    if (new Date(share.expiredAt).getTime() < Date.now()) {
      return res.status(403).json({
        error: {
          message: 'Token expired',
        },
      });
    }
    if (expand === '1' && parentIds) {
      const { data, total } = await getShareChildren(
        share,
        parentIds.split(','),
      );
      return res.json({ data, meta: { total, type: 'expand' } });
    }
    // if (share.sourceId === -1) {
    //   const where = { type: 'file', sourceId: { $gt: 0 } };
    //   const list = await Share.find(where, {
    //     limit: pageSize,
    //     order: { updatedAt: ORDER_TYPE.DESC },
    //   });
    //   const data = [];
    //   const total = await Share.count(where);
    //   for (const item of list) {
    //     const source = await File.getFileInfoById(item.sourceId);
    //     if (!source) {
    //       continue;
    //     }
    //     data.push({ ...source, expiredAt: item.expiredAt });
    //   }
    //   return res.json({ data, meta: { total, type: 'all' } });
    // }
    const source = await File.getFileInfoById(share.sourceId);
    if (!source) {
      return res.status(403).json({
        errorMessage: 'File not found',
      });
    }
    return res.json({
      data: [{ ...source, expiredAt: share.expiredAt }],
      meta: { total: 1, type: 'single' },
    });
  });
  app.get('/share/album', async (req, res, next) => {
    const { offset, limit, id, token } = req.query as any;
    const share = await Share.findById(id);
    if (!share) {
      return res.status(404).json({ errorMessage: 'not found' });
    }
    const album = await Album.findById(share.sourceId);
    if (!album) {
      return res.status(404).json({ errorMessage: 'not found' });
    }
    const photos = await Photo.find({ albumId: album.id }, { offset, limit });
    const total = await Photo.find({ albumId: album.id });
    const data = [];
    for (const photo of photos) {
      const file = await File.findById(photo.fileId);
      if (!file) {
        continue;
      }
      const url = await getFileUrl({
        shareId: share.id,
        token: share.token,
        type: share.type,
        sourceId: photo.id,
      });
      data.push({ ...photo.toObject(), url });
    }
    return res.json({
      data: data,
      meta: { total, expiredAt: share.expiredAt },
    });
  });
  app.get('/uploader', async (req, res, next) => {
    try {
      const { id, token, type } = req.query as any;
      const result = await Share.getUploader({ id, type, token });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  app.get('/share/view', async (req, res, next) => {
    try {
      const { id, token, sourceId } = req.query as any;
      const fileObj = await getShareFileObj({
        shareId: id,
        sourceId,
        token,
        type: 'file',
      });
      const url = await getFileUrl({
        shareId: id,
        token,
        type: 'file',
        sourceId,
      });
      res.json({
        data: { ...fileObj.toObject(), url },
      });
    } catch (err) {
      next(err);
    }

    // if (share.token !== token) {
    //   return res.status(403).json({
    //     errorMessage: 'Invalid token',
    //   });
    // }
    // if (new Date(share.expiredAt).getTime() < Date.now()) {
    //   return res.status(403).json({
    //     errorMessage: 'Token expired',
    //   });
    // }
    // if (share.sourceId === -1) {
    //   const where = { type: 'file', sourceId: { $gt: 0 } };
    //   const list = await Share.find(where, {
    //     limit: pageSize,
    //     order: { updatedAt: 'desc' },
    //   });
    //   const data = [];
    //   const total = await Share.count(where);
    //   for (const item of list) {
    //     const source = await FileSystem.findById(item.sourceId);
    //     if (!source) {
    //       continue;
    //     }
    //     data.push({ ...source.toJSON(), expiredAt: item.expiredAt });
    //   }
    //   return res.json({ data, meta: { total, type: 'all' } });
    // }
    // const source = await FileSystem.findById(share.sourceId);
    // if (!source) {
    //   return res.status(403).json({
    //     errorMessage: 'File not found',
    //   });
    // }
    // if (source.isFolder && expand === '1') {
    //   const list = await FileSystem.find(
    //     { parentId: source.id },
    //     { limit: pageSize, order: { updatedAt: 'desc' } },
    //   );
    //   const total = await FileSystem.count({ parentId: source.id });
    //   const data = list.map((item) => {
    //     return { ...item.toJSON(), expiredAt: share.expiredAt };
    //   });
    //   return res.json({ data, meta: { total, type: 'directory' } });
    // }

    // return {
    //   data: [{ ...source.toJSON(), expiredAt: share.expiredAt }],
    //   meta: { total: 1, type: 'single' },
    // };
  });

  return app;
};
