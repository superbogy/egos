import { FileDownloadJob } from './file-download';
import { getNoneExistedFilename } from '@egos/storage';
import path from 'path';
import { getDriverByBucket } from '../lib/bucket';
import { FileObject, FileObjectSchema } from '../models/file-object';
import { IpcMainEvent } from 'electron';
import { DownloadPayload } from './interfaces';
import { File, Photo, TaskSchema } from '../models';
import { getTaskPassword } from './helper';
import { getDownloadPath } from '../lib/helper';
import fs from 'fs';

export class ImageDownloadJob extends FileDownloadJob {
  protected type = 'image';

  async buildPayload(task: TaskSchema): Promise<any> {
    const sourceId = task.sourceId;
    const password = getTaskPassword(task.id);
    const savePath = getDownloadPath();

    return { fileId: sourceId, taskId: task.id, savePath, password };
  }

  async process(
    event: IpcMainEvent,
    payload: DownloadPayload,
  ): Promise<FileObjectSchema | undefined> {
    const { fileId, savePath } = payload;
    const photo = await Photo.findById(fileId as number);
    if (!photo) {
      return;
    }
    const file = await File.findByIdOrError(photo.fileId);
    const fileObj = await FileObject.findByIdOrError(file.objectId as number);
    const driver = getDriverByBucket(fileObj.bucket);
    const dest = await getNoneExistedFilename(
      file.filename as string,
      savePath,
    );
    const source = driver.getPath(fileObj.remote);
    const writeParams = {
      source,
      dest,
      taskId: payload.taskId,
      bucket: fileObj.bucket,
      password: payload.password,
      crypto: '',
    };
    await this.write(event, writeParams);
    return fileObj.toJSON() as FileObjectSchema;
  }
}
