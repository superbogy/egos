import * as service from './service';
// import { EffectsCommandMap, SubscriptionAPI } from 'dva';
import { EffectsCommandMap, SubscriptionAPI, AnyAction } from 'umi';
console.log('123 mnodel account');
export default {
  namespace: 'account',
  state: {
    activeKey: 'base',
    drivers: {},
    buckets: [],
  },
  subscriptions: {
    setup({ dispatch, history }: SubscriptionAPI) {
      return history.listen(({ location }: any) => {
        console.log('????? setup', location);
        if (
          location.pathname === '/account/setting' ||
          location.pathname === '/'
        ) {
          dispatch({
            type: 'init',
            payload: location.state || {},
          });
        }
      });
    },
  },
  effects: {
    *init({ payload }: any, { put, call }: EffectsCommandMap) {
      console.log('init payload', payload);
      if (payload.activeKey === 'storage') {
        const { drivers, buckets } = yield call(service.getStorageDrivers);
        payload.drivers = drivers;
        payload.buckets = buckets;
      }
      yield put({
        type: 'updateState',
        payload: { ...payload },
      });
    },
    *updateBucket(
      { payload }: Record<string, any>,
      { call, put }: EffectsCommandMap,
    ) {
      yield service.updateBucket(payload);
      const { drivers, buckets } = yield call(service.getStorageDrivers);
      yield put({
        type: 'updateState',
        payload: { drivers, buckets },
      });
    },
  },
  reducers: {
    updateState(state: Record<string, any>, { payload }: AnyAction) {
      return { ...state, ...payload };
    },
  },
};
