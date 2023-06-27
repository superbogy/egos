import { ipcMain, IpcMainEvent } from 'electron';
import { FILE_UPLOAD_CHANNEL } from './constants';
import { FileUploadJob } from './file-upload';
import { FILE_DECRYPT_CANCEL, FILE_ENCRYPT_CANCEL } from '../event/constant';
import { FileDownloadJob } from './file-download';

export const registerJob = () => {
  const fileUploadJob = new FileUploadJob({
    channel: FILE_UPLOAD_CHANNEL,
    action: 'upload',
  });
  fileUploadJob.watch();
  const downloadJob = new FileDownloadJob({
    channel: FILE_DECRYPT_CANCEL,
    action: 'download',
  });
};
