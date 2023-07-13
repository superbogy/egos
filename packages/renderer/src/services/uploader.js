import OSS from 'ali-oss';
import * as fs from 'fs';
import { Photo } from '@/services/photo';
import Bucket from '@/services/bucket';

const ossBucket = Bucket.findOne({
  userId: 1,
  platform: 'ALIYUN-OSS',
  status: `active`,
});
const conOpts = ossBucket.config;
const oss = new OSS(conOpts);
export const upload = async (photo) => {
  const { local, remote } = photo;
  if (!fs.existsSync(local)) {
    throw new Error('file not exists');
  }
  const res = await oss.put(remote, local);
  return Photo.insert(photo);
};
