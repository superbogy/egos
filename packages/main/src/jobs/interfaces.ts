export interface UploadPayload {
  local: string;
  parentId?: number;
  name?: string;
  taskId: string | number;
  bucket?: { name: string };
  fileId?: number;
  isEncrypt?: boolean;
  password?: string;
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
