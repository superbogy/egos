import Model from './base';

export interface UrlItem {
  bucket: string;
  url: string;
}

export interface ShareSchema {
  id: number;
  url: {
    internal: UrlItem[];
    external: UrlItem[];
  };
  type: string;
  sourceId: number;
  action: string;
  token: string;
  isExternal: number;
  expiredAt: string;
  createdAt: string;
  updatedAt: string;
}

class Share extends Model {
  getShareByFileId(...args: any[]) {
    return this.exec('getShareByFileId', ...args);
  }

  getShareByAlbumId(...args: any[]) {
    return this.exec('getAlbumUploadShareById', ...args);
  }

  shareFile(...args: any[]) {
    return this.exec('shareFile', ...args);
  }

  shareAlbum(...args: any[]) {
    return this.exec('shareAlbum', ...args);
  }

  getShareBySource(...args: any[]) {
    return this.exec('getShareBySource', ...args);
  }
  genFileUploadUrl(...args: any[]) {
    return this.exec('genFileUploadUrl', ...args);
  }
  genAlbumUploadUrl(...args: any[]) {
    return this.exec('genAlbumUploadUrl', ...args);
  }
}

export default new Share('shares');
