import fs from 'fs';
import path from 'path';
import { fromStream } from 'file-type';
import Mime from 'mime';
import os from 'os';
import { FileMeta } from '@/interface';

export const getFileMeta = async (file: string) => {
  const stat = await fs.promises.stat(file);
  const filename = path.basename(file);
  const stream = fs.createReadStream(file);
  const mime = (await fromStream(stream)) as FileMeta;
  console.log('mmmmmmmimeeeee', mime);
  const fileMeta: FileMeta = mime || { mime: '', ext: path.extname(filename) };
  if (!mime) {
    fileMeta.mime = Mime.getType(filename) as string;
  }

  let type = 'text';
  if (fileMeta.mime) {
    [type] = fileMeta.mime.split('/');
  }
  return {
    filename,
    type,
    mime: fileMeta.mime || '',
    ext: fileMeta.ext || '',
    size: stat.size,
    mtime: new Date(stat.mtime).toISOString(),
  };
};
