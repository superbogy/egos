import Base from './base';

export interface FileObjectSchema {
  id: number;
  type: string;
  bucket: string;
  filename: string;
  remote: string;
  editable: number;
  local?: string;
  size: number;
  ext?: string;
  mime?: string;
  mtime?: string;
  md5: string;
  isEncrypt: number;
  url?: string;
}

class FileObject extends Base {
  _table = 'file_object';

  async task({
    file,
    parentId,
    root,
  }: {
    file: string;
    parentId: number;
    root?: string;
  }): Promise<any> {
    return this.task({ file, parentId, root });
  }
}

export default new FileObject('file_object');
