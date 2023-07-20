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
  shootedAt: string;
  createdAt: string;
  updatedAt: string;
}
class PhoneService extends Base {
  _table = 'photos';

  async searchPhoto(payload: any) {
    return this.exec('searchPhoto', payload);
  }
}

export const Photo = new PhoneService('photos');
