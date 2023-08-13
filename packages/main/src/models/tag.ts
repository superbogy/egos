import { Builder, column, connect, Model, table } from '@egos/lite';
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

  async setTags({
    ids,
    tags,
    type,
  }: {
    ids: number[];
    tags: string[];
    type: string;
  }) {
    for (const id of ids) {
      for (const tag of tags) {
        await this.findAndCreate(tag, id, type);
      }
    }
  }

  async getTagsWithSourceId(sourceIds: number[], type: string) {
    const builder = new Builder(this.table);
    const { sql, params } = builder
      .fields(['*'], this.table)
      .fields(['source_id'], TagMap.table)
      .LeftJoin(TagMap.table, { id: 'tag_id' })
      .where(
        {
          'tag_sources.source_id': { $in: sourceIds },
          type,
        },
        '',
      )
      .select();
    const res = await this.query(sql, params);
    console.log('11~~~~~~~~~~~~>', res);
    const unique: number[] = [];
    return res
      .map((r: any) => TagMap.toProps(this.toProps(r)))
      .filter((i: { id: number }) => {
        if (unique.includes(i.id)) {
          return false;
        }
        unique.push(i.id);
        return true;
      });
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
