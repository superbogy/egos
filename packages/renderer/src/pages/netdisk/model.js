import storage from '@/services/storage';
import { isEmpty } from 'ramda';
import { ipcEvent } from '../../lib/event';
import * as services from './service';

export default {
  namespace: 'disk',
  state: {
    entrance: [],
    query: {
      display: 'card',
    },
    meta: {
      total: 0,
    },
    files: [],
    parentId: '',
    order: { id: 'desc' },
    currentFolder: { path: '/', id: 0 },
    location: {},
    availableFolders: [],
    selected: [],
    inProgressNumber: 0,
    shareDetail: null,
    uploadUrl: '',
  },
  subscriptions: {
    setup({ dispatch, history }) {
      history.listen((location) => {
        if (location.pathname === '/disk' || location.pathname === '/') {
          const { query } = location;
          const custom = storage.getUserData('/disk') || {};
          const { display = 'card', order = { id: 'desc' } } = custom;
          dispatch({
            type: 'init',
            payload: {
              query: { ...query, order, display },
              location: { ...location },
            },
          });
          ipcEvent.register('upload-success', () => {
            dispatch({ type: 'query', payload: {} });
          });
        }
      });
    },
  },
  effects: {
    *init({ payload }, { put, call, select }) {
      const { location } = payload;
      yield put({
        type: 'updateState',
        payload: { ...payload },
      });
      const state = yield select(({ disk }) => disk);
      const { entrance } = state;
      if (!entrance.length) {
        const entrance = yield call(services.getQuickEntrance);
        yield put({
          type: 'updateState',
          payload: { entrance },
        });
      }
      yield put({
        type: 'query',
        payload: {
          ...location.query,
        },
      });
    },
    *query({ payload }, { call, put, select }) {
      const { location, ...current } = yield select((s) => {
        const { disk } = s;
        return { query: disk.query, meta: disk.meta, location: disk.location };
      });
      if (isEmpty(payload)) {
        Object.assign(payload, location.query);
      }
      const params = {
        ...current.query,
        ...payload,
      };
      const { meta: newMeta, data } = yield call(services.query, params);
      const { files, parent } = data;
      const inProgressNumber = yield call(services.progressTaskNumber, params);
      const newState = {
        files,
        currentFolder: parent,
        parentId: parent.id,
        inProgressNumber,
        meta: { ...current.meta, ...newMeta },
      };
      yield put({
        type: 'updateState',
        payload: newState,
      });
    },
    *upload({ payload }, { call }) {
      yield call(services.upload, { ...payload });
    },
    *download({ payload }, { call }) {
      yield call(services.download, { ...payload });
    },
    *likeIt({ payload }, { call }) {
      yield call(services.star, { ...payload });
    },
    *setUserAction({ payload }, { call, put, select }) {
      const { query } = yield select(({ disk }) => disk);
      const { display, order } = payload;
      const pathname = '/disk';
      const actions = {};
      if (display) {
        storage.setUserData(pathname, 'display', display);
        actions.display = display;
      }
      if (order) {
        storage.setUserData(pathname, 'order', order);
        actions.order = order;
      }
      yield put({
        type: 'updateState',
        payload: { query: { ...query, ...actions } },
      });
    },
    *moveToTrash({ payload }, { call, put, select }) {
      const { ids } = payload;
      yield call(services.moveToTrash, { ids });
      yield put({
        type: 'query',
        payload: {},
      });
    },
    *createFolder({ payload }, { call, put }) {
      yield call(services.createFolder, payload);
    },
    *gotoPath({ payload }, { select, call, put }) {
      const { path } = payload;
      const target = yield call(services.getFolderByPath, { path });
      if (!target) {
        return null;
      }
      return target;
    },
    *move({ payload }, { call, put }) {
      const { sourceIds, target } = payload;
      if (!sourceIds.length || !target) {
        return;
      }
      if (sourceIds.includes(target.id)) {
        return;
      }
      yield call(services.move, { sourceIds, targetId: target.id });
      yield put({
        type: 'query',
        payload: {},
      });
    },
    *rename({ payload }, { call, put }) {
      yield call(services.rename, payload);
    },
    *searchFolder({ payload }, { call, put }) {
      const { name } = payload;
      const folders = yield call(services.searchFolders, { name });
      yield put({
        type: 'updateState',
        payload: { availableFolders: folders },
      });
    },
    *save({ payload }, { call, put }) {
      yield call(services.save, payload);
      yield put({
        type: 'query',
        payload: {},
      });
    },
    *share({ payload }, { call, put }) {
      const res = yield call(services.share, payload);
      yield put({
        type: 'updateState',
        payload: { shareDetail: res },
      });
    },
    *getShare({ payload }, { call, put }) {
      const shareDetail = yield call(services.getShare, payload);
      yield put({
        type: 'updateState',
        payload: { shareDetail },
      });
    },
    *genUploadUrl({ payload }, { call, put }) {
      const uploadUrl = yield call(services.genQrUpload, payload);
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
    processUpload() {},
  },
};
