import { BaseModel } from '@/utils';
import modelExtend from 'dva-model-extend';
import * as service from './service';

const model = modelExtend(BaseModel, {
  namespace: 'album',
  state: {
    list: [],
    limit: 25,
    offset: 0,
    meta: { total: 0, type: 'single' },
  },
  subscriptions: {
    setup({ dispatch, history }) {
      history.listen((location) => {
        if (location.pathname === '/album') {
          const { query } = location;
          dispatch({
            type: 'query',
            payload: {
              ...query,
            },
          });
        }
      });
    },
  },
  effects: {
    *query({ payload }, { call, put }) {
      const res = yield call(service.query, payload);
      const { data, meta } = res;
      yield put({
        type: 'updateState',
        payload: { list: data, meta },
      });
    },
  },
});

export default model;
