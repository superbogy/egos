import Stream from 'stream';
import { FileMeta } from './src/interface';
interface Egos {
  getModel: any;
}

interface Electron {
  [key: string]: any;
}

declare module 'file-type' {
  export const fileTypeFromStream: (stream: Stream) => FileMeta;
}
