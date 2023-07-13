import Base from './base';

export interface PhotoShema {
  id: number;
  albumId: number;
  fileId: number;
  status: string;
  type: string;
  size: number;
  serialNo: number;
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
