import { column, connect, Model, table } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';

@table('favorites')
class FavoriteModel extends Base {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.INT })
  sourceId: number;
  @column({ type: FieldTypes.TEXT, default: '' })
  type: string;

  async star(sourceId: number, type: string) {
    const cur = await Favorite.findOne({ sourceId, type });
    if (cur) {
      await cur.remove();
      return false;
    }
    await this.create({ sourceId, type });
    return true;
  }

  async unstar(sourceId: number, type: string) {
    const cur = await Favorite.findOne({ sourceId, type });
    if (!cur) {
      return false;
    }
    return cur.remove();
  }
}

export const Favorite = new FavoriteModel();
