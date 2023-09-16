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
    let linked: any = await TagMap.findOne({ tagId: tag.id, sourceId, type });
    if (!linked) {
      linked = await TagMap.create({ sourceId, tagId: tag.id, type });
    }
    return { ...tag.toJSON(), sourceId, mapId: linked.id };
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
      const related = await this.getTagsWithSourceId([id], 'photo');
      const notFound = related.filter(
        (item: { name: string }) => !tags.includes(item.name),
      );
      await Promise.all(
        notFound.map((item: any) => {
          return TagMap.deleteById(item.mapId);
        }),
      );
      const res = [];
      for (const tag of tags) {
        const t = await this.findAndCreate(tag, id, type);
        res.push(t);
      }
      return res;
    }
  }

  async getTagsWithSourceId(sourceIds: number[], type: string) {
    const builder = new Builder(TagMap.table);
    const { sql, params } = builder
      .fields(['*'], this.table)
      .fields(['source_id', 'id as mapId'], TagMap.table)
      .LeftJoin(this.table, { tag_id: 'id' })
      .where(
        {
          'tag_sources.source_id': { $in: sourceIds },
          type,
        },
        '',
      )
      .select();
    const res = await this.query(sql, params);
    return res.map((r: any) => TagMap.toProps(this.toProps(r)));
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
