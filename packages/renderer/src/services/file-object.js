import Base from './base';
import { ServiceError } from '../lib/error';
import path from 'path';
import Queue from './queue';
import Bucket from './bucket';
import { getFileMeta } from '../lib/helper';

class File extends Base {
  _table = 'file_object';

  async task({ file, parentId, root }) {
    try {
      const meta = await getFileMeta(file);
      const user = { id: 1, username: 'tommy' };
      const { filename, type, mime, size, ext, mtime } = meta;
      const description = '';
      const bucket = await Bucket.findOne({ status: 'active' });
      const prefix = root || '2gos-file';
      const fileItem = [prefix, user.username];
      if (parentId) {
        fileItem.push(String(parentId));
      }
      fileItem.push(filename);
      const remote = path.join(...fileItem);
      const photo = {
        filename,
        userId: user.id,
        bucketId: bucket.id,
        parentId: parentId || '',
        type,
        ext,
        remote,
        local: file,
        isFolder: 0,
        mime,
        size,
        md5: '',
        description,
        mtime,
      };
      const task = {
        action: 'upload',
        type: 'file',
        payload: photo,
        status: 'pending',
        retry: 0,
        maxRetry: 3,
        err: '',
      };
      return Queue.insert(task);
    } catch (err) {
      throw new ServiceError({ message: String(err.message), code: 10501 });
    }
  }
}
export default new File('files');
