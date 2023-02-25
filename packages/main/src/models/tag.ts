import { column, connect, Model, table } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';

@table('tags')
class TagModel extends Base {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.TEXT })
  name: string;
  @column({ type: FieldTypes.TEXT, default: '' })
  color: string;
}

export const Tag = new TagModel();
