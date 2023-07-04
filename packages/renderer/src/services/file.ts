import Model from './base';
import { FileObjectSchema } from './file-object';

export interface FileSchema {
  id: number;
  type: string;
  objectId: number;
  parentId: number;
  isFolder: number;
  path: string;
  filename: string;
  size: number;
  description?: string;
  starred?: boolean;
  file?: FileObjectSchema;
  tags: any[];
  password?: string;
  isEncrypt: number;
  createdAt: string;
  updatedAt: string;
  shared: boolean;
}
class File extends Model {
  async getFiles(payload: any): Promise<FileSchema[]> {
    return await this.exec('getFiles', payload);
  }

  async buildDefaultFolders(): Promise<FileSchema> {
    return this.exec('buildDefaultFolders');
  }
  async getQuickEntrance(): Promise<FileSchema[]> {
    return this.exec('getQuickEntrance');
  }

  updateFileTags(id: number, tags: string[]) {
    return this.exec('updateFileTags', id, tags);
  }

  async crypto(id: number, password: string, type: string) {
    return this.exec('crypto', id, password, type);
  }

  async verify(id: number, password: string) {
    return this.exec('verify', id, password);
  }
}
export default new File('files');
