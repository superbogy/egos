import Base from './base';

export interface PhotoSchema {
  id: number;
  albumId: number;
  objectId: number;
  status: string;
  type: string;
  size: number;
  rank: number;
  isEncrypt: number;
  password?: string;
  location?: string;
  description: string;
  photoDate: string;
  createdAt: string;
  updatedAt: string;
  starred?: boolean;
  tags?: string[];
}
class PhoneService extends Base {
  _table = 'photos';

  async searchPhoto(payload: any) {
    return this.exec('searchPhoto', payload);
  }

  removePhotos(payload: { ids: number[]; albumId: number }) {
    return this.exec('removePhotos', payload);
  }
  move(payload: { sourceId: number; targetId: number }) {
    return this.exec('move', payload);
  }
  moveToDay(payload: { sourceId: number; day: string }) {
    return this.exec('moveToDay', payload);
  }
  rename(id: number, name: string) {
    return this.exec('rename', id, name);
  }
  star(id: number) {
    return this.exec('star', id);
  }
  unstar(id: number) {
    return this.exec('unstar', id);
  }
}

export const Photo = new PhoneService('photos');
