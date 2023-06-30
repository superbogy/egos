import { Model } from 'dva';

declare module 'file-icons-js' {
  export function getClass(name: string): string;
  export function getClassWithColor(name: string): string;
}

declare module 'dva-model-extend' {
  export default function modelExtend(...models: Model[]): Model;
}

declare module 'qrcode' {
  export function toDataURL(url: string): Promise<string>;
}

declare module 'react-infinite-scroller' {
  type Props = {
    pageStart: number;
    hasMore: boolean;
    loadMore: () => void;
  };
  export default (props: Props) => React.FC<Props>;
}
