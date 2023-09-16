export interface FileMeta {
  ext: string;
  type: string;
  mime: string;
  endings?: string;
}

export interface AlbumQuery {
  name?: string;
  order?: any;
}
export interface Pagination {
  offset?: number;
  limit?: number;
}
