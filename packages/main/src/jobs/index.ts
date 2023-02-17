import { ipcMain, IpcMainEvent } from 'electron';
import { FILE_UPLOAD_CHANNEL } from './constants';
import { FileUploadJob } from './file-upload';

export const registerJob = () => {
  const fileUploadJob = new FileUploadJob({ channel: FILE_UPLOAD_CHANNEL });
  fileUploadJob.watch();
};
