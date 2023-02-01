export interface BucketItem {
  alias: string;
  name: string;
  type: string;
  prefix: string;
  status: BUCKET_STATUS;
  driver: Drivers;
  synchronize: [];
  config: any;
}

export interface StorageCallback {
  cancel: () => any;
}

export interface ChunkProps {
  dest: string;
  type: string;
  eTag?: string;
  size: number;
  partNumber: number;
}

export interface FileObject {
  remote: string;
  filename: string;
  ext?: string;
}
