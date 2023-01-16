import { column, connect, Model, table } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';

@table('albums')
class AlbumModel extends Base {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.TEXT })
  name: string;
  @column({ type: FieldTypes.INT, default: '' })
  rank: number;
  @column({ type: FieldTypes.INT, default: '' })
  cover: number;
  @column({ type: FieldTypes.TEXT, default: '' })
  source: string;
  @column({ type: FieldTypes.TEXT, default: '' })
  sourceId: number;
  @column({ type: FieldTypes.TEXT, default: '' })
  sortBy: string;
  @column({ type: FieldTypes.TEXT, default: '' })
  description: number;
  @column({ type: FieldTypes.TEXT, default: '' })
  tags?: number;
}

export const Album = new AlbumModel();
