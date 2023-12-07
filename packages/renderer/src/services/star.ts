import Base from './base';

export enum StarType {
  FILE = 'file',
  ALBUM = 'album',
  PHOTO = 'photo',
}

class StarService extends Base {
  star(id: number, type: StarType) {
    this.exec('star', id, type);
  }
  unstar(id: number, type: StarType) {
    this.exec('unstar', id, type);
  }
}

export const Star = new StarService('favorites');
