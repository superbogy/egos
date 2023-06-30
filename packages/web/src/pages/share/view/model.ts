import { BaseModel } from '@/utils';
import type { Location } from 'umi';
import * as service from './service';
import modelExtend from 'dva-model-extend';

export interface FileItem {
  id: string;
  type: string;
  isFolder: number;
  filename: string;
  expiredAt: string;
}

export type FileState = {
  fileObj: Record<string, any> | null
}

const model = modelExtend(BaseModel, {
  namespace: 'view',
  state: {
    fileObj: null
  },
  subscriptions: {
    setup({ dispatch, history }) {
      history.listen((location: Location) => {
        if (location.pathname === '/share/view') {
          const { query } = location;
          dispatch({
            type: 'query',
            payload: {
              ...query
            },
          });
        }
      });
    },
  },
  effects: {
    *query({ payload }, { call, put }): Generator<void> {
      console.log('view file item', payload);
      const res: any = yield call(service.getFileObj, payload);
      console.log('rrrrres', res)
      yield put({
        type: 'updateState',
        payload: {
          isView: true,
          fileObj: res.data
        }
      })
    }
  }
});

export default model;
