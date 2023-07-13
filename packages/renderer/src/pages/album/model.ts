import { message } from 'antd';
import * as service from './service';
import { AnyAction } from 'umi';
import { EffectsCommandMap } from 'dva';
import { AlbumSchema } from '@/services/album';
import { ShareSchema } from '@/services/share';

export interface AlbumState {
  files: any[];
  albums: AlbumSchema[];
  buckets: any[];
  tasks: any[];
  query: Record<string, any>;
  modal: boolean;
  selected: number[];
  searchAlbums: AlbumSchema[];
  total: number;
  display: string;
  pending: any[];
  shareDetail: any;
}
export default {
  namespace: 'album',
  state: {
    files: [],
    albums: [],
    buckets: [],
    tasks: [],
    query: {},
    modal: false,
    selected: [],
    searchAlbums: [],
    total: 0,
    display: 'card',
    pending: [],
    shareDetail: null,
  },
  effects: {
    *init({ payload }: AnyAction, { put }: EffectsCommandMap) {
      yield put({
        type: 'query',
        payload,
      });
    },
    *query({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
      const albums: AlbumSchema[] = yield call(service.fetchAlbums, payload);
      yield put({
        type: 'updateState',
        payload: { albums, searchAlbums: albums },
      });
    },
    *save({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
      const res: AlbumSchema = yield call(service.createAlbum, payload);
      if (res instanceof Error) {
        message.error(res.message);
      }
      yield put({
        type: 'query',
        payload: {},
      });
      message.success('success');
    },
    *rename({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
      const { name, id } = payload;
      yield call(service.rename, { name, id });
      yield put({
        type: 'query',
        payload: {},
      });
    },
    *move({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
      const { sourceId, targetId } = payload;
      yield call(service.move, { sourceId, targetId });
      yield put({
        type: 'query',
        payload: {},
      });
    },
    *search({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
      const { keyword } = payload;
      if (!keyword) {
        return;
      }
      const res: AlbumSchema[] = yield call(service.search, { keyword });
      yield put({
        type: 'updateState',
        payload: {
          searchAlbums: res,
        },
      });
    },
    *upload({ payload }: AnyAction, { call }: EffectsCommandMap) {
      console.log('model upload', payload);
      yield call(service.upload, payload);
    },
    // *getPending({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
    //   const pending = yield call(service.getPendingUpload);
    //   yield put({
    //     type: 'updateState',
    //     payload: { pending },
    //   });
    // },
    *getShare({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
      const shareDetail: ShareSchema = yield call(service.getShare, payload);
      console.log('get shareDetail', shareDetail);
      yield put({
        type: 'updateState',
        payload: { shareDetail },
      });
    },
    *share({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
      const res: ShareSchema = yield call(service.share, payload);
      console.log('share result', res);
      yield put({
        type: 'updateState',
        payload: { shareDetail: res },
      });
    },
  },
  reducers: {
    loadAlbums(
      state: Record<string, any>,
      action: { payload: Record<string, any> },
    ) {
      const { payload } = action;
      return { ...state, albums: payload.albums };
    },
    processUpload(state: Record<string, any>) {
      (window as any).ElectronApi.send('photoUpload', 'ping1');
      return { ...state };
    },
    saveCurrentUser(
      state: Record<string, any>,
      action: { payload: Record<string, any> },
    ) {
      return { ...state, currentUser: action.payload || {} };
    },
    toggleModal(
      state: Record<string, any>,
      { payload }: { payload: Record<string, any> },
    ) {
      return { ...state, modal: Boolean(payload.visible) };
    },
    select(
      state: Record<string, any>,
      { payload }: { payload: Record<string, any> },
    ) {
      const { ids } = payload;
      const { selected } = state;
      if (Array.isArray(ids)) {
        ids.map((id) => {
          const index = selected.indexOf(id);
          if (index === -1) {
            selected.push(id);
          } else {
            selected.splice(index, 1);
          }
          return id;
        });
      }

      return { ...state, selected };
    },
    updateState(
      state: Record<string, any>,
      { payload }: { payload: Record<string, any> },
    ) {
      return { ...state, ...payload };
    },
  },
};
