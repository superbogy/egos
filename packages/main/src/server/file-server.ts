import fs from 'fs';
import multer from 'multer';
import { Express } from 'express';
import os from 'os';
import path from 'path';
import { getAvailableBucket, getDriverByBucket } from '../lib/bucket';
import { ServiceError } from '../error';
import { Album, File, Share, Task } from '../models';
import error from './error';
import { getShareFileObj } from './helper';
import { Application, Request, Response } from 'express';
import { NextFunction } from 'express-serve-static-core';
import { getFileMeta } from '@/lib/helper';

const upload = multer({ dest: path.join(os.tmpdir(), 'egos') });
export default (app: Application) => {
  // file server
  app.get(
    '/files/:id',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params as any;
        const { sourceId, type, token } = req.query as any;
        const file = await getShareFileObj({
          shareId: id,
          sourceId,
          type,
          token,
        });
        const driver = getDriverByBucket(file.bucket);
        const local = await driver.getCacheFilePath(file);
        const range = req.headers.range;
        if (file.type === 'video' && range && !req.query.download) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const fileSize = file.size;
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          if (start >= fileSize) {
            res
              .status(416)
              .send(
                'Requested range not satisfiable\n' + start + ' >= ' + fileSize,
              );
            return;
          }

          const chunksize = end - start + 1;
          const stream = fs.createReadStream(local, {
            start,
            end,
          });
          const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
          };

          res.writeHead(206, head);
          return stream.pipe(res);
          // const CHUNK_SIZE = 10 ** 6;
          // const size = file.size;
          // const start = range ? Number(range.replace(/\D/g, '')) : 0;
          // // range && console.log(range.replace(/bytes=/, '').split('-'), range);
          // const end = Math.min(start + CHUNK_SIZE, size - 1);
          // const contentLength = end - start + 1;
          // const headers = {
          //   'Content-Range': `bytes ${start}-${end}/${size}`,
          //   'accept-ranges': 'bytes',
          //   'Content-Length': contentLength,
          //   'content-type': file.mime,
          // };
          // res.writeHead(206, headers);
          // console.log('fffffile video', start, end);
          // const stream = fs.createReadStream('/Users/tommy/Desktop/23.mp4', {
          //   start,
          //   end,
          // });
          // return stream.pipe(res);
        } else {
          if (req.query.download) {
            res.setHeader(
              'Content-disposition',
              'attachment; filename=' + encodeURI(file.filename),
            );
          }
          res.writeHead(200, {
            'Content-Length': file.size,
            'Content-Type': file.mime,
          });
          return fs.createReadStream(local).pipe(res);
        }
      } catch (err) {
        return next(err);
      }
    },
  );
  app.post('/files/upload', upload.array('files'), async (req, res, next) => {
    try {
      const { token, id } = req.query as any;
      const share = await Share.findById(id);
      if (!share || share.token !== token) {
        throw new ServiceError({
          message: 'Forbidden upload',
          code: 10403,
          statusCode: 403,
        });
      }
      if (share.action !== 'upload') {
        throw new ServiceError(error.InvalidShareType);
      }
      if (new Date(share.expiredAt).getTime() < Date.now()) {
        throw new ServiceError(error.TokenExpired);
      }
      const model = share.type === 'album' ? Album : File;
      const parent = await model.findById(share.sourceId);
      if (!parent) {
        throw new ServiceError(error.SourceNotFound);
      }
      const files = req.files as Express.Multer.File[];
      if (!files) {
        return res.json({
          message: 'ok',
        });
      }
      await Task.buildUploadTasks({
        files: files.map((f) => f.path),
        parentId: parent.id,
        type: 'file',
      });

      res.json({
        message: 'ok',
      });
    } catch (err) {
      next(err);
    }
  });
  app.post(
    '/files/upload/photo',
    upload.array('files'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { token, id } = req.query as any;
        const share = await Share.findByIdOrError(id);
        if (!share || share.token !== token) {
          throw new ServiceError({
            message: 'Forbidden upload',
            code: 10403,
            statusCode: 403,
          });
        }
        if (share.type !== 'album' || share.action !== 'upload') {
          throw new ServiceError(error.InvalidShareType);
        }
        if (new Date(share.expiredAt).getTime() < Date.now()) {
          throw new ServiceError(error.TokenExpired);
        }
        const parent = await Album.findById(share.sourceId);
        if (!parent) {
          throw new ServiceError(error.SourceNotFound);
        }
        const files = req.files as Express.Multer.File[];
        const b = getAvailableBucket('image');
        if (!b) {
          throw new ServiceError(error.InvalidUploadParam);
        }
        await Task.buildUploadTasks({
          files: files.map((f) => f.path),
          parentId: parent.id,
          type: 'photo',
        });

        return res.json({
          message: 'ok',
        });
      } catch (err) {
        next(err);
      }
    },
  );
};
