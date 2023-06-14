export interface BucketItem {
  alias?: string;
  name: string;
  type: string;
  prefix?: string;
  isDefault?: boolean;
  status: BUCKET_STATUS;
  driver: Drivers;
  synchronize?: [];
  config: any;
}

export interface StorageCallback {
  cancel: () => any;
}

export interface ChunkProps {
  dest: string;
  type: string;
  eTag?: string;
  cursor: number;
}

export interface FileObject {
  remote: string;
  filename: string;
  ext?: string;
}

export interface FlightItem {
  taskId: number;
  source: any;
  timestamp: number;
}

export type speedCallback = (params: {
  cursor: number;
  lastPoint: number;
  interval: number;
  size?: number;
}) => void;

export interface UploadOptions {
  taskId: number;
  onProgress?: speedCallback;
  interval?: number;
  secret?: string;
  isEncrypt?: boolean;
  isDecrypt?: boolean;
  onFinish?: (params: { taskId: number }) => void;
}
