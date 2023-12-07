import { getNoneExistedFilename } from '@egos/storage';
import { promises as fsp } from 'fs';

import { getDriverByBucket } from '../lib/bucket';
import { getDownloadPath } from '../lib/helper';
import { File } from '../models/file';
import { FileObject, FileObjectSchema } from '../models/file-object';
import { Task, TaskSchema } from '../models/task';
import { IpcMainEvent } from 'electron';
import { AlbumDownloadPayload } from './interfaces';
import { getTaskPassword } from './helper';
import { Album, Photo } from '../models';
import { ServiceError } from '../error';
import { Job } from './job';

export class AlbumDownloadJob extends Job {
  protected type = 'album';
  async getTasks() {
    console.log('ffffuck', { type: this.type, action: 'download' });
    return Task.find({ type: this.type, action: 'download' }, { limit: 10 });
  }

  async buildPayload(task: TaskSchema): Promise<any> {
    const sourceId = task.sourceId;
    const album = await Album.findById(sourceId);
    if (!album) {
      throw new ServiceError({
        message: 'Download album not found',
      });
    }
    const password = getTaskPassword(task.id);
    if (album.password !== password) {
      throw new ServiceError({
        message: 'Password incorrect',
      });
    }

    const savePath = getDownloadPath();

    return { albumId: sourceId, taskId: task.id, savePath, password: '' };
  }

  async pause(event: IpcMainEvent, { taskIds }: { taskIds: number[] }) {}
  async cancel(
    event: IpcMainEvent,
    { taskIds, type }: { taskIds: number[]; type: string },
  ) {}

  async process(event: IpcMainEvent, payload: AlbumDownloadPayload) {
    const { albumId, savePath } = payload;
    const album = await File.findById(albumId);
    if (!album) {
      return;
    }
    await fsp.mkdir(savePath);

    let offset = 0;
    const limit = 10;
    const curDir = await getNoneExistedFilename(album.name, savePath);
    while (true) {
      const photos = await Photo.find(
        { albumId: album.id, status: 'done' },
        { offset, limit },
      );
      offset += limit;
      if (photos.length < limit) {
        break;
      }
      await Promise.all(
        photos.map((p) =>
          this.downloadPhoto(event, {
            taskId: payload.taskId as string,
            savePath: curDir,
            photoId: p.id,
          }),
        ),
      );
    }
  }

  async downloadPhoto(
    event: IpcMainEvent,
    payload: { savePath: string; photoId: number; taskId: string },
  ) {
    const photo = await Photo.findById(payload.photoId);
    if (!photo) {
      return;
    }
    const file = await File.findByIdOrError(photo.fileId);
    const fileObj = await FileObject.findByIdOrError(file?.objectId as number);
    const driver = getDriverByBucket(fileObj.bucket);
    const dest = await getNoneExistedFilename(
      file.filename as string,
      payload.savePath,
    );
    const source = driver.getPath(fileObj.remote);
    const writeParams = {
      source,
      dest,
      taskId: payload.taskId,
      bucket: fileObj.bucket,
      password: '',
      crypto: '',
    };
    await this.write(event, writeParams);
    return fileObj.toJSON() as FileObjectSchema;
  }
}
