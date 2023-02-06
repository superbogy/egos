import { dialog, ipcMain, shell } from 'electron';
import { getBuckets, updateBucket } from '../lib/bucket';
import { getDriverSchemas } from '@egos/storage';

export const registerChannel = () => {
  ipcMain.handle('get@account:buckets', async (_, { type, name, status }) => {
    let buckets = getBuckets();
    if (name) {
      buckets = buckets.filter((item) => item.name === name);
    }
    if (type) {
      buckets = buckets.filter((item) => item.type === type);
    }
    if (status) {
      buckets = buckets.filter((item) => item.status === status);
    }
    return buckets.map((item) => {
      return { ...item };
    });
  });
  ipcMain.handle('get@account:drivers', async () => {
    return getDriverSchemas();
  });
  ipcMain.handle('update@account:buckets', async (ev, { bucket }) => {
    console.log('bucket', bucket);
    return updateBucket(bucket);
  });
};
