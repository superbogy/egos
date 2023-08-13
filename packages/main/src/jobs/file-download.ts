import { getNoneExistedFilename } from '@egos/storage';
import { promises as fsp } from 'fs';
import path from 'path';

import { getDriverByBucket } from '../lib/bucket';
import { getDownloadPath } from '../lib/helper';
import { File } from '../models/file';
import { FileObject, FileObjectSchema } from '../models/file-object';
import { Task, TaskSchema } from '../models/task';
import { IpcMainEvent } from 'electron';
import { FileJob } from './file.job';
import { DownloadPayload } from './interfaces';
import { getTaskPassword } from './helper';

export class FileDownloadJob extends FileJob {
  protected type = 'file';
  // async getTasks() {
  //   console.log('ffffuck', { type: this.type, action: 'download' });
  //   return Task.find({ type: this.type, action: 'download' }, { limit: 10 });
  // }

  async buildPayload(task: TaskSchema): Promise<any> {
    const sourceId = task.sourceId;
    const password = getTaskPassword(task.id);
    const savePath = getDownloadPath();

    return { fileId: sourceId, taskId: task.id, savePath, password };
  }

  async pause(event: IpcMainEvent, { taskIds }: { taskIds: number[] }) {}
  async cancel(
    event: IpcMainEvent,
    { taskIds, type }: { taskIds: number[]; type: string },
  ) {}

  async process(
    event: IpcMainEvent,
    payload: DownloadPayload,
  ): Promise<FileObjectSchema | undefined> {
    const { fileId, savePath } = payload;
    const fileItem = await File.findById(fileId as number);
    if (!fileItem) {
      return;
    }
    if (fileItem.isDiectory) {
      const curDir = path.join(savePath, fileItem.filename);
      await fsp.mkdir(curDir);
      let offset = 0;
      const limit = 10;
      while (true) {
        const fileItems = await File.find(
          { parentId: fileItem.id },
          { offset, limit },
        );
        offset += limit;
        await Promise.all(
          fileItems.map((item) =>
            this.process(event, {
              ...payload,
              fileId: item.id,
              savePath: curDir,
            }),
          ),
        );
        if (fileItems.length < limit) {
          break;
        }
      }
    }
    const file = await File.findByIdOrError(fileId as number);
    const fileObj = await FileObject.findByIdOrError(file?.objectId as number);
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
