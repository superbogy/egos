import { BaseModel } from '@/utils';
import modelExtend from 'dva-model-extend';
import * as service from './service';
import type { History, Dispatch, Location } from 'umi';
import type { EffectsCommandMap } from 'dva'


export type SourceItem = {
  id: string,
  filename: string,
}
export type Meta = {
  type: string,
}
export type UploaderState = {
  source: {
    id: string,
    filename?: string,
    name?: string,
    path?: string,
  },
  meta: {
    type: string
  }
}

export default modelExtend(BaseModel, {
  namespace: 'uploader',
  state: {
    source: null,
    meta: { type: 'file' }
  },
  subscriptions: {
    setup({ dispatch, history }: { dispatch: Dispatch, history: History }) {
      history.listen((location: Location) => {
        if (location.pathname === '/uploader') {
          dispatch({
            type: 'query',
            payload: location.query
          })
        }
      });
    }
  },
  effects: {
    *query({ payload }, { call, put }: EffectsCommandMap): Generator<void> {
      const res = (yield call(service.query, payload)) as { data: SourceItem, meta: Meta };
      // res.data.path = '/Document/bar';
      yield put({
        type: 'updateState',
        payload: {
          source: res.data,
          meta: res.meta,
        }
      });
    }
  }
});
