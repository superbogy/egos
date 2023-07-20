import { column, connect, Model, table } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';

@table('tag_sources')
class TagSource extends Base {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.INT })
  tagId: number;
  @column({ type: FieldTypes.INT })
  sourceId: number;
  @column({ type: FieldTypes.TEXT, default: '' })
  type: string;
}

export const TagMap = new TagSource();
