import { ipcMain, IpcMainEvent } from 'electron';
import { FILE_DOWNLOAD_CHANNEL, FILE_UPLOAD_CHANNEL } from './constants';
import { FileUploadJob } from './file-upload';
import { FileDownloadJob } from './file-download';

export const registerJob = () => {
  const fileUploadJob = new FileUploadJob({
    channel: FILE_UPLOAD_CHANNEL,
    action: 'upload',
  });
  fileUploadJob.watch();
  const downloadJob = new FileDownloadJob({
    channel: FILE_DOWNLOAD_CHANNEL,
    action: 'download',
  });
  downloadJob.watch();
};
