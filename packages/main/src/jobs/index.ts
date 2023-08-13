import {
  FILE_DOWNLOAD_CHANNEL,
  FILE_UPLOAD_CHANNEL,
  IMAGE_DOWNLOAD_CHANNEL,
  IMAGE_UPLOAD_CHANNEL,
} from './constants';
import { FileUploadJob } from './file-upload';
import { FileDownloadJob } from './file-download';
import { FileCryptoJob } from './file-crypto';
import { PhotoUploadJob } from './photo-upload';
import { ImageDownloadJob } from './image-download';

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
  const cryptoJob = new FileCryptoJob({
    channel: FILE_UPLOAD_CHANNEL,
    action: 'crypto',
  });
  cryptoJob.watch();
  const imageUploadJob = new PhotoUploadJob({
    channel: IMAGE_UPLOAD_CHANNEL,
    action: 'upload',
  });
  imageUploadJob.watch();
  const imageDownloadJob = new ImageDownloadJob({
    channel: IMAGE_DOWNLOAD_CHANNEL,
    action: 'download',
  });
  imageDownloadJob.watch();
};
