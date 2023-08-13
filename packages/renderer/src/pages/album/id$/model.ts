import { message } from 'antd';
import * as service from './service';
import { PhotoSchema } from '@/services/photo';
import { AlbumSchema } from '@/services/album';
import { AnyAction } from 'umi';
import { EffectsCommandMap } from 'dva';
import { ShareSchema } from '@/services/share';
import { TagSchema } from '@/services/schema';

export type PhotoMeta = {
  total: number;
  album: AlbumSchema;
  tags: TagSchema[];
};

export type PhotoState = {
  files: any[];
  photos: Record<string, PhotoSchema[]>;
  selected: number[];
  buckets: any[];
  visible: boolean;
  order: Record<string, string>;
  meta: PhotoMeta;
  uploadUrl: string;
  share: ShareSchema | null;
  pendingTags: any[];
};

export default {
  namespace: 'photo',
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
      tags: [],
    },
    uploadUrl: '',
    share: null,
  },
  effects: {
    *query({ payload }: AnyAction, { call, put, select }: EffectsCommandMap) {
      const { meta, query } = yield select(
        ({ photo }: { photo: PhotoState }) => photo,
      );
      const album = meta.album || {};
      const albumId = payload.albumId || album.id;
      const res: { data: PhotoSchema[]; meta: PhotoMeta } = yield call(
        service.searchPhoto,
        {
          order: {
            photo_date: 'desc',
            rank: 'desc',
          },
          ...payload,
          ...query,
          albumId,
        },
      );
      const group: Record<string, any> = {};
      const ds = 86400 * 1000;
      res.data.map((item: PhotoSchema) => {
        const key =
          Math.floor(
            new Date(item.photoDate || item.createdAt).getTime() / ds,
          ) * ds;
        if (group[key]) {
          group[key].push(item);
        } else {
          group[key] = [item];
        }
        return item;
      });
      yield put({
        type: 'updateState',
        payload: {
          photos: group,
          meta: { ...meta, ...res.meta },
        },
      });
    },
    *getShare({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
      const share: ShareSchema = yield call(service.getShare, payload);
      yield put({
        type: 'updateState',
        payload: { share },
      });
    },
    *upload({ payload }: AnyAction, { call }: EffectsCommandMap) {
      yield call(service.photoUpload, payload);
    },
    *download({ payload }: AnyAction, { call }: EffectsCommandMap) {
      yield call(service.download, payload);
    },
    *update({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
      yield call(service.photoUpdate, payload);
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
    *moveToDay({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
      const { sourceId, day } = payload;
      const res: boolean = yield call(service.moveToDay, { sourceId, day });
      console.log('move to day result', payload);
      if (res) {
        yield put({
          type: 'query',
          payload: {},
        });
      }
    },
    *setCover({ payload }: AnyAction, { call }: EffectsCommandMap) {
      yield call(service.setCover, payload);
      message.success('success');
      // const album = yield select(({ albumInfo }) => albumInfo.meta);
    },
    *delete({ payload }: AnyAction, { call, put, select }: EffectsCommandMap) {
      yield call(service.removePhotos, payload);
      const meta: PhotoMeta = yield select(
        ({ photo }: { photo: PhotoState }) => photo.meta,
      );
      message.success('success');
      yield put({
        type: 'query',
        payload: { albumId: meta.album.id },
      });
    },
    *genUploadUrl({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
      const share: ShareSchema = yield call(service.genQrUpload, payload);
      console.log('get genUrl', share);
      yield put({
        type: 'updateState',
        payload: { share },
      });
    },
  },
  reducers: {
    updateState(state: PhotoState, { payload }: AnyAction) {
      return { ...state, ...payload };
    },
    processUpload(state: PhotoState, { payload }: AnyAction) {
      return { ...state, ...payload };
    },
  },
};
