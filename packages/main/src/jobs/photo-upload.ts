import fs from 'fs';

import { ServiceError } from '../error';
import { Album, FileObject, Photo, Task, TaskModel } from '../models';
import { IpcMainEvent } from 'electron';
import { FileJob } from './file.job';
import { UploadPayload } from './interfaces';

export interface PhotoUploadPayload extends UploadPayload {
  uid: string;
}

export class PhotoUploadJob extends FileJob {
  protected type = 'image';

  async getTasks(): Promise<TaskModel[]> {
    return Task.find(
      {
        type: 'photo',
        status: 'pending',
      },
      { limit: 20 },
    );
  }

  async process(event: IpcMainEvent, payload: PhotoUploadPayload) {
    console.log('image upload payload   =====????', payload);
    const { local, taskId, password, fileId } = payload;
    if (!local) {
      throw new ServiceError({
        message: 'Resource not found',
      });
    }
    const photo = await Photo.findByIdOrError(fileId);
    const album = await Album.findById(photo.albumId);
    if (!album) {
      throw new ServiceError({
        message: 'Album not found',
      });
    }

    const exists = fs.existsSync(local);
    if (!exists) {
      throw new ServiceError({
        message: 'Invalid upload file',
      });
    }
    const fileObj = await this.addFile(event, payload);
    if (!fileObj) {
      throw new ServiceError({
        message: 'Upload failed',
      });
    }
    const current = await Photo.findByIdOrError(payload.fileId);
    await current.updateAttributes({
      objectId: fileObj.id,
      password,
      isEncrypt: payload.action === 'encrypt' ? 1 : 0,
      status: 'done',
      size: fileObj.size,
    });
    return fileObj;
  }
}
