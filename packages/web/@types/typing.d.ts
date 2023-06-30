
declare module 'file-icons-js' {
  export function getClass(name: string): string
}

declare module 'dva-model-extend' {
  import type { Model } from "dva"
  export default function modelExtend(...models: Model[]): Model
}

declare module 'qrcode' {
  export function toDataUrl(url: string): string;
}
