import { column, connect, Model, table } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';

@table('favorites')
class FavoriteModel extends Base {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.TEXT })
  sourceId: string;
  @column({ type: FieldTypes.TEXT, default: '""' })
  type: string;
}

export const Favorite = new FavoriteModel();
