import Base from './base';

class TagService extends Base {
  async searchTags(name: string) {
    return this.exec('searchTags', name);
  }
}

export const Tag = new TagService('tags');
