import Model from './base';
import { FileObjectSchema } from './file-object';

export interface FileSchema {
  id: number;
  type: string;
  fileId: number;
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
  createdAt: string;
  updatedAt: string;
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

  async encrypt(id: number, password: string) {
    return this.exec('encrypt', id, password);
  }

  async decrypt(id: number, password: string) {
    return this.exec('decrypt', id, password);
  }
}
export default new File('files');
