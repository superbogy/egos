import { column, table } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';

export interface BackupItem {
  bucket: string;
  status: string;
}

@table('file_objects')
export class FileObjectModel extends Base {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.TEXT })
  type: string;
  @column({ type: FieldTypes.TEXT, default: '' })
  bucket: string;
  @column({ type: FieldTypes.TEXT, default: '' })
  filename: string;
  @column({ type: FieldTypes.TEXT, default: '' })
  remote: string;
  @column({ type: FieldTypes.INT, default: '' })
  editable: number;
  @column({ type: FieldTypes.TEXT, default: '' })
  local: string;
  @column({ type: FieldTypes.INT, default: '' })
  size: number;
  @column({ type: FieldTypes.TEXT, default: '' })
  ext?: string;
  @column({ type: FieldTypes.TEXT, default: '' })
  mime: string;
  @column({ type: FieldTypes.TEXT, default: '' })
  mtime: string;
  @column({ type: FieldTypes.TEXT, default: '' })
  md5: string;
  @column({ type: FieldTypes.INT, default: '0' })
  isEncrypt: number;
  @column({ type: FieldTypes.TEXT, default: '' })
  backup: BackupItem[];
  @column({ type: FieldTypes.TEXT, default: '' })
  checkpoint: string;

  async task({
    file,
    parentId,
    root,
  }: {
    file: string;
    parentId: number;
    root?: string;
  }) {
    // try {
    //   const meta = await getFileMeta(file);
    //   const user = { id: 1, username: 'tommy' };
    //   const { filename, type, mime, size, ext, mtime } = meta;
    //   const description = '';
    //   const bucket = await getBucketByName('');
    //   const prefix = root || '2gos-file';
    //   const fileItem = [prefix, user.username];
    //   if (parentId) {
    //     fileItem.push(String(parentId));
    //   }
    //   fileItem.push(filename);
    //   const remote = path.join(...fileItem);
    //   const photo = {
    //     filename,
    //     userId: user.id,
    //     bucketId: bucket.id,
    //     parentId: parentId || '',
    //     type,
    //     ext,
    //     remote,
    //     local: file,
    //     isFolder: 0,
    //     mime,
    //     size,
    //     md5: '',
    //     description,
    //     mtime,
    //   };
    //   const task = {
    //     action: 'upload',
    //     type: 'file',
    //     payload: photo,
    //     status: 'pending',
    //     retry: 0,
    //     maxRetry: 3,
    //     err: '',
    //   };
    //   return Queue.insert(task);
    // } catch (err) {
    //   throw new ServiceError((err as Error).message, { code: 10501 });
    // }
  }
}

export const FileObject = new FileObjectModel();
