import Model from './base';
import { FileObjectSchema } from './file-object';

export interface AlbumSchema {
  id: number;
  name: string;
  coverId: number;
  rank: number;
  description: string;
  file: FileObjectSchema;
  createdAt: string;
  updatedAt: string;
}

export class AlbumService extends Model {
  async createAlbum(data: Partial<AlbumSchema>) {
    return this.exec('createAlbum', data);
  }
}

export const Album = new AlbumService('albums');
