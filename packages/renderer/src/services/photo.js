import Base from './base';

class Phone extends Base {
  _table = 'photos';

  async searchPhoto(payload) {
    return this.exec('searchPhoto', payload);
  }
}

const photo = new Phone('photos');

export default photo;
