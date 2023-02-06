import { column, connect, Model, table } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';

@table('files')
class FileModel extends Base {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.TEXT })
  type: string;
  @column({ type: FieldTypes.INT, default: '' })
  fileId: number;
  @column({ type: FieldTypes.INT, default: '' })
  parentId: number;
  @column({ type: FieldTypes.INT, default: '' })
  isFolder: number;
  @column({ type: FieldTypes.TEXT, default: '' })
  path: string;
  @column({ type: FieldTypes.TEXT, default: '' })
  filename: string;
  @column({ type: FieldTypes.TEXT, default: '' })
  size: number;
  @column({ type: FieldTypes.TEXT, default: '' })
  description: string;
}

export const File = new FileModel();
