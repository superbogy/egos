import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import proxy from 'express-http-proxy';
import fs from 'fs';
import { getIPAddress, getPort } from '../lib/helper';
import { File, Photo, Album, Share } from '../models';
import Api from './api';
import FileServer from './file-server';
import { ServiceError } from '../error';
import { Model } from '@egos/lite';

const app = express();

const shareModels: Record<string, Model> = {
  file: File,
  photo: Photo,
  album: Album,
};
const category = [
  {
    alias: 'File',
    name: 'file-system',
    icon: 'book-open',
  },
  {
    alias: 'Image',
    name: 'albums',
    icon: 'picture',
  },
  {
    alias: 'Note',
    name: 'notes',
    icon: 'doc-text',
  },
  {
    alias: 'Local',
    name: 'local',
    icon: 'monitor',
  },
];

export const getServer = async () => {
  const port = await getPort();
  const ip = getIPAddress();
  app.use(express.static(__dirname + '/assets'));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(cors());
  app.use('/api', Api(express.Router()));
  FileServer(app);
  // app.use(
  //   '/',
  //   proxy(`${ip}:8001`, {
  //     filter: async function (req) {
  //       console.log(
  //         'proxy filter',
  //         req.path.startsWith('/api'),
  //         process.env.NODE_ENV === 'development',
  //       );
  //       if (req.path.startsWith('/api')) {
  //         return false;
  //       }
  //       return process.env.NODE_ENV === 'development';
  //     },
  //   }),
  // );
  app.get('/share', async function (req, res) {
    const { token, type = 'file' } = req.query as any;
    const share = await Share.find({
      token,
      expiredAt: { $lt: new Date().toISOString() },
      type,
    });
    if (!(type in shareModels)) {
      throw new ServiceError({ message: 'Invalid type' });
    }
    const data = [];
    for (const s of share) {
      const item = s.toJSON();
      const model = shareModels[s.type];
      const source = await (shareModels[s.type] as Model).findById(s.sourceId);
      if (source) {
        item.resource = source.toJSON();
      }
      data.push(item);
    }
    res.render('index', {
      data,
      category,
      current: 'file-system',
      type,
      token,
    });
  });
  // app.post('files/:id', async (req, res) => {
  //   const file = __dirname + '/upload-folder/dramaticpenguin.MOV';
  //   const filename = path.basename(file);
  //   const mimetype = 'image/png';
  //   res.setHeader('Content-disposition', 'attachment; filename=' + filename);
  //   res.setHeader('Content-type', mimetype);
  //   const fileStream = fs.createReadStream(file);
  //   fileStream.pipe(res);
  // });

  app.get('/files/:id/download', async (req, res) => {
    const id = req.params.id;
    const token = req.query.token;
    const share = await Share.findById(id);
    if (!share || share.token !== token) {
      return res.status(404).send('Not found');
    }
    if (new Date(share.expiredAt) < new Date()) {
      return res.status(403).send('File expired');
    }
    const model = shareModels[share.type];
    if (!model) {
      return res.status(403).send('Invalid file type');
    }
    const source = await model.findById(share.sourceId);
    if (!source) {
      return res.status(404).send('Not found');
    }
    const file = await File.findByIdOrError(source.fileId);
    const filename = file.filename;
    res.setHeader('Content-disposition', 'attachment; filename=' + filename);
    res.setHeader('Content-type', file.mime);
    console.log(file);
    const fileStream = fs.createReadStream(file.local);
    return fileStream.pipe(res);
  });

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('-----eeeeeee------', err);
    console.log(err);
    res.status(500).json({
      errorMessage: err.message,
      stack: err.stack,
    });
  });

  return { app, port, ip };
};
