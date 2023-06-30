import { BaseModel } from '@/utils';
import * as service from './service';
import modelExtend from 'dva-model-extend';

export interface FileItem {
  id: string;
  type: string;
  isFolder: number;
  filename: string;
  expiredAt: string;
}

export type ShareState = {
  list: FileItem[];
  meta: { total: number; type: string };
  pageSize: number;
  fileObj: Record<string, any> | null;
};

const model = modelExtend(BaseModel, {
  namespace: 'share',
  state: {
    list: [],
    pageSize: 25,
    meta: { total: 0, type: 'single' },
    fileObj: null,
  },
  effects: {
    *query({ payload }, { call, put }): Generator<void> {
      console.log('query', payload);
      const res: any = yield call(service.query, payload);
      const { data, meta } = res;
      console.log('ressssss', res);
      yield put({
        type: 'updateState',
        payload: { list: data, meta },
      });
    },
    *view({ payload }, { call, put }): Generator<void> {
      console.log('view file item', payload);
      const res: any = yield call(service.getFileObj, payload);
      yield put({
        type: 'updateState',
        payload: {
          isView: true,
          fileObj: res,
        },
      });
    },
  },
});

export default model;
