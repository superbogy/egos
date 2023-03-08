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

  async findAndCreate(tag: string, color?: string) {
    const cur = await this.findOne({ name: tag });
    if (cur) {
      return cur.toJSON();
    }
    const c = color || '#' + Math.floor(Math.random() * 16777215).toString(16);
    return (await this.create({ name: tag, color: c })).toJSON();
  }
}

export const Tag = new TagModel();
