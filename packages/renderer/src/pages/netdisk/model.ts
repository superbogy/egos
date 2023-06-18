import { ShareSchema } from '@/services/share';
import storage from '@/services/storage';
import { isEmpty } from 'ramda';
import { AnyAction, EffectsCommandMap } from 'umi';
import * as services from './service';
import { FileSchema } from '@/services/file';
import { Remote } from '@/lib/remote';

export enum FileDisplay {
  CARD = 'card',
  LIST = 'list',
}

export interface Tag {
  name: string;
  color: string;
}
export interface DiskState {
  entrance: any[];
  query: {
    display: 'card' | 'list';
  };
  meta: {
    total: number;
    pageSize?: number;
    tags: Tag[];
  };
  files: FileSchema[];
  parentId: string;
  order: any; // @todo
  currentFolder: any; // @todo
  location: any; // @todo
  availableFolders: FileSchema[];
  selected: number[];
  inProgressNumber: number;
  shareDetail: null | ShareSchema;
  uploadUrl: string;
}
const model = {
  namespace: 'netdisk',
  state: {
    entrance: [],
    query: {},
    display: 'card',
    meta: {
      total: 0,
      tags: [],
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
  effects: {
    *init(
      { payload }: any,
      { put, call, select }: EffectsCommandMap,
    ): Generator<any> {
      const { location } = payload;
      const qs = location?.state || {};
      const state = yield select(
        ({ netdisk }: { netdisk: DiskState }): DiskState => netdisk,
      );
      const { entrance } = state as DiskState;
      if (!entrance.length) {
        const entrance = yield call(services.getQuickEntrance);
        yield put({
          type: 'updateState',
          payload: { entrance },
        });
      }
      Remote.Electron.ipcRenderer.send('file:upload:start', { type: 'file' });
      yield put({
        type: 'query',
        payload: qs || {},
      });
    },
    *query(
      { payload = {} }: AnyAction,
      { call, put, select }: EffectsCommandMap,
    ) {
      console.log('query payload', payload);
      if (!payload || isEmpty(payload)) {
        const { query } = yield select((s: any) => {
          const { netdisk } = s;
          return {
            query: netdisk.query,
          };
        });
        Object.assign(payload, query);
      }
      const { meta: newMeta, data } = yield call(services.query, payload);
      const { files, parent } = data;
      console.log(newMeta, data);
      const inProgressNumber: number = yield call(
        services.progressTaskNumber,
        payload,
      );
      const newState = {
        files,
        currentFolder: parent,
        parentId: parent.id,
        inProgressNumber,
        query: payload,
        meta: { ...newMeta },
      };
      yield put({
        type: 'updateState',
        payload: newState,
      });
    },
    *upload({ payload }: AnyAction, { call }: EffectsCommandMap) {
      yield call(services.upload, { ...payload });
    },
    *download({ payload }: AnyAction, { call }: EffectsCommandMap) {
      yield call(services.download, { ...payload });
    },
    *likeIt({ payload }: AnyAction, { call }: EffectsCommandMap) {
      yield call(services.star, { ...payload });
    },
    *setUserAction({ payload }: AnyAction, { put, select }: EffectsCommandMap) {
      const { query } = yield select(({ netdisk }: any) => netdisk);
      const { display, order } = payload;
      const pathname = '/disk';
      const actions: Record<string, any> = {};
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
    *moveToTrash({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
      const { ids } = payload;
      yield call(services.moveToTrash, { ids });
      yield put({
        type: 'query',
        payload: {},
      });
    },
    *createFolder(
      { payload }: AnyAction,
      { call, put, select }: EffectsCommandMap,
    ) {
      yield call(services.createFolder, payload);
      const { query, parentId } = yield select(({ netdisk }: any) => netdisk);
      yield put({
        type: 'query',
        payload: {
          ...query,
          parentId,
        },
      });
    },
    *gotoPath({ payload }: AnyAction, { call }: EffectsCommandMap) {
      const { path } = payload;
      const target: null | string = yield call(services.getFolderByPath, {
        path,
      });
      if (!target) {
        return null;
      }
      return target;
    },
    *move({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
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
    *rename({ payload }: AnyAction, { call }: EffectsCommandMap) {
      yield call(services.rename, payload);
    },
    *searchFolder({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
      const { name } = payload;
      const folders: any[] = yield call(services.searchFolders, { name });
      yield put({
        type: 'updateState',
        payload: { availableFolders: folders },
      });
    },
    *save({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
      console.log('ssssave', payload);
      yield call(services.save, payload);
      yield put({
        type: 'query',
        payload: {},
      });
    },
    *share({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
      const res: Record<string, any> = yield call(services.share, payload);
      yield put({
        type: 'updateState',
        payload: { shareDetail: res },
      });
    },
    *getShare({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
      const shareDetail: Record<string, any> = yield call(
        services.getShare,
        payload,
      );
      yield put({
        type: 'updateState',
        payload: { shareDetail },
      });
    },
    *genUploadUrl({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
      const uploadUrl: string = yield call(services.genQrUpload, payload);
      yield put({
        type: 'updateState',
        payload: { uploadUrl },
      });
    },
    *updateTags({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
      yield call(services.updateFileTags, payload);
      yield put({
        type: 'query',
        payload: {},
      });
    },
    *crypt({ payload }: AnyAction, { call }: EffectsCommandMap) {
      yield call(services.encrypt, payload);
    },
    *decrypt({ payload }: AnyAction, { call }: EffectsCommandMap) {
      yield call(services.decrypt, payload);
    },
  },
  reducers: {
    updateState(state: Record<string, any>, { payload }: any) {
      return { ...state, ...payload };
    },
    processUpload() {},
  },
};

export default model;
