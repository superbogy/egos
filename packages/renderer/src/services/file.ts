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
  tag?: string[];
  createdAt: string;
  updatedAt: string;
}
class File extends Model {
  async getFiles(payload: any): Promise<FileSchema[]> {
    console.log('xxxxxxxxpayload', payload);
    return await this.exec('getFiles', payload);
  }

  async buildDefaultFolders(): Promise<FileSchema> {
    return this.exec('buildDefaultFolders');
  }
  async getQuickEntrance(): Promise<FileSchema[]> {
    return this.exec('getQuickEntrance');
  }
}
export default new File('files');
