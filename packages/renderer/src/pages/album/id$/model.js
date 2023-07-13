import { message } from 'antd';
import * as service from './service';

export default {
  namespace: 'albumInfo',
  state: {
    files: [],
    photos: [],
    selected: [],
    buckets: [],
    visible: false,
    order: { id: 'desc' },
    meta: {
      total: 0,
      album: {},
    },
    uploadUrl: '',
  },
  // subscriptions: {
  //   setup({ dispatch, history }) {
  //     history.listen((location) => {
  //       const match = pathToRegexp('/album/:id').exec(location.pathname);
  //       if (match) {
  //         dispatch({
  //           type: 'init',
  //           payload: {
  //             ...location.query,
  //             albumId: match[1],
  //           },
  //         });
  //         ipcEvent.register('photo-result', (ev, { message }) => {
  //           if (message === 'success') {
  //             dispatch({
  //               type: 'query',
  //               payload: {},
  //             });
  //           }
  //         });
  //       }
  //     });
  //   },
  // },
  effects: {
    *init({ payload }, { call, put }) {
      yield put({
        type: 'query',
        payload,
      });
      const buckets = [];
      yield put({
        type: 'updateState',
        payload: { buckets },
      });
    },
    *query({ payload }, { call, put, select }) {
      const { meta, query } = yield select(({ albumInfo }) => albumInfo);
      const album = meta.album || {};
      const albumId = payload.albumId || album.id;
      console.log('query photos', { ...payload, ...query, albumId });
      const res = yield call(service.searchPhoto, {
        order: {
          shootAt: 'desc',
          rank: 'desc',
        },
        ...payload,
        ...query,
        albumId,
      });
      const group = {};
      const ds = 86400 * 1000;
      res.data.map((item) => {
        const key = Math.floor(new Date(item.shootAt).getTime() / ds) * ds;
        if (group[key]) {
          group[key].push(item);
        } else {
          group[key] = [item];
        }
      });
      yield put({
        type: 'updateState',
        payload: {
          photos: group,
          meta: { ...meta, ...res.meta },
        },
      });
    },
    *upload({ payload }, { call, put }) {
      const response = yield call(service.photoUpload, payload);
      yield put({
        type: 'processUpload',
        payload: response,
      });
    },
    *move({ payload }, { call, put }) {
      const { sourceId, targetId } = payload;
      yield call(service.move, { sourceId, targetId });
      yield put({
        type: 'query',
        payload: {},
      });
    },
    *moveToDay({ payload }, { call, put }) {
      const { sourceId, day } = payload;
      const res = yield call(service.moveToDay, { sourceId, day });
      console.log('move to day result', res);
      if (res) {
        yield put({
          type: 'query',
          payload: {},
        });
      }
    },
    *setCover({ payload }, { call, select }) {
      yield call(service.setCover, payload);
      message.success('success');
      // const album = yield select(({ albumInfo }) => albumInfo.meta);
    },
    *delete({ payload }, { call, put, select }) {
      yield call(service.removePhotos, payload);
      const meta = yield select(({ albumInfo }) => albumInfo.meta);
      message.success('success');
      yield put({
        type: 'query',
        payload: { albumId: meta.album.id },
      });
    },
    *genUploadUrl({ payload }, { call, put }) {
      const uploadUrl = yield call(service.genQrUpload, payload);
      console.log('get genUrl', uploadUrl);
      yield put({
        type: 'updateState',
        payload: { uploadUrl },
      });
    },
  },
  reducers: {
    updateState(state, { payload }) {
      return { ...state, ...payload };
    },
    processUpload(state, action) {
      window.ElectronApi.send('photoUpload', 'ping1');
      return { ...state };
    },
    saveCurrentUser(state, action) {
      return { ...state, currentUser: action.payload || {} };
    },
    changeNotifyCount(
      state = {
        currentUser: {},
      },
      action,
    ) {
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          notifyCount: action.payload.totalCount,
          unreadCount: action.payload.unreadCount,
        },
      };
    },
  },
};
