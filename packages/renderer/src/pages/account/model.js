import * as service from './service';
export default {
  namespace: 'account',
  state: {
    activeKey: 'base',
    drivers: {},
    buckets: [],
  },
  subscriptions: {
    setup({ dispatch, history }) {
      history.listen((location) => {
        const query = location.query;
        if (
          location.pathname === '/account/setting' ||
          location.pathname === '/'
        ) {
          dispatch({
            type: 'init',
            payload: { ...query },
          });
        }
      });
    },
  },
  effects: {
    *init({ payload }, { put, call }) {
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
    *updateBucket({ payload }, { call, put }) {
      yield service.updateBucket(payload);
      const { drivers, buckets } = yield call(service.getStorageDrivers);
      yield put({
        type: 'updateState',
        payload: { drivers, buckets },
      });
    },
  },
  reducers: {
    updateState(state, { payload }) {
      return { ...state, ...payload };
    },
  },
};
