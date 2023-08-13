import Base from './base';

class TagService extends Base {
  async searchTags(name: string) {
    return this.exec('searchTags', name);
  }

  async setTags(params: { ids: number[]; tags: string[]; type: string }) {
    return this.exec('setTags', params);
  }
}

export const Tag = new TagService('tags');

export interface TagSchema {
  id: number;
  name: string;
  color: string;
}
