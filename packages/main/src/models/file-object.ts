import { column, connect, Model, table } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';

@table('file_objects')
class FileObjectModel extends Base {
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
  mime?: string;
  @column({ type: FieldTypes.TEXT, default: '' })
  mtime?: string;
  @column({ type: FieldTypes.TEXT, default: '' })
  md5: string;
  @column({ type: FieldTypes.INT, default: '0' })
  isEncrypt: number;
}

export const FileObject = new FileObjectModel();
