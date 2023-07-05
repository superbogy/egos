import { column, schema, table } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';
import { getDriverByBucket } from '../lib/bucket';
import fs from 'fs';
import { jsonParser, jsonStringify } from '../lib/helper';

export interface BackupItem {
  bucket: string;
  status: string;
}

export class FileObjectSchema {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.TEXT })
  type: string;
  @column({ type: FieldTypes.TEXT, default: '""' })
  bucket: string;
  @column({ type: FieldTypes.TEXT, default: '""' })
  filename: string;
  @column({ type: FieldTypes.TEXT, default: '""' })
  remote: string;
  @column({ type: FieldTypes.INT, default: '""' })
  editable: number;
  @column({ type: FieldTypes.TEXT, default: '""' })
  local: string;
  @column({ type: FieldTypes.INT, default: '""' })
  size: number;
  @column({ type: FieldTypes.TEXT, default: '""' })
  ext?: string;
  @column({ type: FieldTypes.TEXT, default: '""' })
  mime: string;
  @column({ type: FieldTypes.TEXT, default: '""' })
  mtime: string;
  @column({ type: FieldTypes.TEXT, default: '""' })
  md5: string;
  @column({ type: FieldTypes.INT, default: '0' })
  isEncrypt: number;
  @column({
    type: FieldTypes.TEXT,
    default: '""',
    decode: jsonParser,
    encode: jsonStringify,
  })
  backup: BackupItem[];
  @column({ type: FieldTypes.TEXT, default: '""' })
  checkpoint: string;
}

@table('file_objects')
@schema(FileObjectSchema)
export class FileObjectModel extends Base {
  async destroy(id: number) {
    const fileObj = await this.findById(id);
    if (!fileObj) {
      return false;
    }
    const driver = getDriverByBucket(fileObj.bucket);
    const target = driver.getPath(fileObj.remote);
    if (fs.existsSync(target)) {
      fs.unlinkSync(target);
    }
  }
}

export const FileObject = new FileObjectModel();
