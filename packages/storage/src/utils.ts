import crypto from 'crypto';
import path from 'path';
import util from 'util';
import fs from 'fs';

export const md5 = (source: crypto.BinaryLike) => {
  return crypto.createHash('md5').update(source).digest('hex');
};

export const getNoneExistedFilename = async (
  filename: string,
  savePath: string,
) => {
  const filePath = path.join(savePath, filename);
  const exists = await util.promisify(fs.exists)(filePath);
  if (!exists) {
    return filePath;
  }
  const ext = path.extname(filename);
  let i = 0;
  for (;;) {
    const postfix = [i ? `(${i})` : '', ext].join('');
    const file = filePath.replace(new RegExp(ext + '$'), postfix);
    i += 1;
    const duplicated = await util.promisify(fs.exists)(file);
    if (!duplicated) {
      return file;
    }
    if (i > 10) {
      throw new Error('can not build filename');
    }
  }
};
