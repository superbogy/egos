// import Base from './base';

// class Share extends Base {
//   _table = 'share';
// }

// export default new Share();

import Model from './base.ts';

class Share extends Model {
  getShareByFileId(...args) {
    return this.exec('getShareByFileId', ...args);
  }

  getShareByAlbumId(...args) {
    return this.exec('getShareByFileId', ...args);
  }

  shareFile(...args) {
    return this.exec('shareFile', ...args);
  }

  shareAlbum(...args) {
    return this.exec('shareAlbum', ...args);
  }

  getShareBySource(...args) {
    return this.exec('getShareBySource', ...args);
  }
  genFileUploadUrl(...args) {
    return this.exec('genFileUploadUrl', ...args);
  }
  genAlbumUploadUrl(...args) {
    return this.exec('genAlbumUploadUrl', ...args);
  }
}

export default new Share('shares');
