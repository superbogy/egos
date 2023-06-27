export interface UploadPayload {
  local: string;
  parentId?: number;
  name: string;
  taskId: number | string;
  bucket?: { name: string };
  fileId?: number;
  cryptType?: string;
  password?: string;
}

export interface WriteFileParams {
  source: string;
  dest: string;
  bucket: string;
  taskId: number | string;
  password: string | undefined;
  crypto?: string;
}

export interface CheckPoint {
  size: number;
  total: number;
  partNumber: number;
  taskId: number | string;
  percent: number;
}

export interface JobOptions {
  channel: string;
  [key: string]: any;
}

export interface DownloadPayload extends UploadPayload {
  savePath: string;
}
