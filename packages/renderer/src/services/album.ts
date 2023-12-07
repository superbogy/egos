import { AlbumQuery, Pagination } from '@/pages/album/service';
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
  objectId?: string;
}

export class AlbumService extends Model {
  async createAlbum(data: Partial<AlbumSchema>) {
    return this.exec('createAlbum', data);
  }
  fetchAlbums(query: AlbumQuery, page: Pagination) {
    return this.exec('fetchAlbums', query, page);
  }
  async star({ ids }: { ids: number[] }) {
    return this.exec('star', { ids });
  }
}

export const Album = new AlbumService('albums');
