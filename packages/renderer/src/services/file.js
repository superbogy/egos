import Model from './base';

class FileSystem extends Model {
  async getFiles(payload) {
    return await this.exec('getFiles', payload);
  }
}
export default new FileSystem('file-system');
