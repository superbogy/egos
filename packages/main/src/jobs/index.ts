import { ipcMain, IpcMainEvent } from 'electron';
import { FILE_UPLOAD_CHANNEL } from './constants';
import { FileUploadJob } from './file-upload';
import { FILE_DECRYPT_CANCEL, FILE_ENCRYPT_CANCEL } from '../event/constant';

export const registerJob = () => {
  const fileUploadJob = new FileUploadJob({
    channel: FILE_UPLOAD_CHANNEL,
    action: 'upload',
  });
  fileUploadJob.watch();
  const encryptJob = new FileUploadJob({
    channel: FILE_ENCRYPT_CANCEL,
    action: 'encrypt',
  });
  encryptJob.watch();
  const decryptJob = new FileUploadJob({
    channel: FILE_DECRYPT_CANCEL,
    action: 'decrypt',
  });
};
