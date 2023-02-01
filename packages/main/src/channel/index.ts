import { dialog, ipcMain, shell } from 'electron';
import { getBuckets, updateBucket } from '@/lib/bucket';
import { getDriverSchemas } from '@egos/storage';

export default () => {
  ipcMain.handle('account:buckets', async (_, { type, name, status }) => {
    let buckets = getBuckets();
    console.log('fucking buckets', buckets, { type, name });
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
  ipcMain.handle('account:drivers', async () => {
    return getDriverSchemas();
  });
  ipcMain.handle('account:buckets:update', async (ev, { bucket }) => {
    console.log('bucket', bucket);
    return updateBucket(bucket);
  });
};
