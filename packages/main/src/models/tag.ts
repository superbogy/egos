import { column, connect, Model, table } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';
import { TagMap } from './tag-source';

@table('tags')
class TagModel extends Base {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.TEXT })
  name: string;
  @column({ type: FieldTypes.TEXT, default: '' })
  color: string;

  async findAndCreate(tagName: string, sourceId: number, type = 'file') {
    let tag = await this.findOne({ name: tagName });
    if (!tag) {
      const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
      tag = await this.create({ name: tagName, color });
    }
    const linked = await TagMap.findOne({ tagId: tag.id, sourceId, type });
    if (!linked) {
      await TagMap.create({ sourceId, tagId: tag.id, type });
    }
    return tag;
  }

  async searchTags(name: string) {
    const tags = await this.find(
      { name: { $like: `%${name}%` } },
      { limit: 10 },
    );
    return tags;
  }
}

export const Tag = new TagModel();
