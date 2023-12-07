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
    *rename({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
      const { id, name } = payload;
      yield call(service.rename, id, name);
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
      yield put({
        type: 'updateState',
        payload: { share },
      });
    },
    *star({ payload }: AnyAction, { call, put }: EffectsCommandMap) {
      const { id } = payload;
      const starred: boolean = yield call(service.star, id);
      yield put({
        type: 'updatePhotoListItem',
        payload: { id, data: { starred } },
      });
    },
    *share({ payload }: AnyAction, { call }: EffectsCommandMap) {
      yield call(service.share, payload);
    },
  },
  reducers: {
    updateState(state: PhotoState, { payload }: AnyAction) {
      return { ...state, ...payload };
    },
    processUpload(state: PhotoState, { payload }: AnyAction) {
      return { ...state, ...payload };
    },
    updatePhotoListItem(state: PhotoState, { payload }: AnyAction) {
      const { id, data } = payload;
      const current: Record<string, PhotoSchema[]> = state.photos;
      const photos: Record<string, PhotoSchema[]> = {};
      Object.entries(current).forEach((item: [string, PhotoSchema[]]) => {
        const [day, list] = item;
        photos[day] = list.map((p) => {
          if (p.id === id) {
            return { ...p, ...data };
          }
          return p;
        });
      });
      return { ...state, photos };
    },
    updateTagsItem(state: PhotoState, { payload }: AnyAction) {
      const { ids, tags }: { ids: number[]; tags: TagSchema[] } = payload;
      const meta: PhotoMeta = state.meta;
      const toObj = (list: TagSchema[], key: keyof TagSchema) => {
        return list.reduce((acc: Record<string, TagSchema>, cur: TagSchema) => {
          acc[cur[key]] = cur;
          return acc;
        }, {});
      };
      const tmap = toObj(tags, 'mapId');
      const cmap = toObj(meta.tags, 'mapId');
      const remove = meta.tags
        .filter((t) => ids.includes(t.sourceId))
        .filter((t2) => !tmap[t2.mapId])
        .map((t3) => t3.mapId);
      const nmap = { ...cmap, ...tmap };
      const newTags = Object.entries(nmap)
        .filter((item: [string, TagSchema]) => {
          return !remove.includes(Number(item[0]));
        })
        .map((i) => i[1]);
      return { ...state, meta: { ...meta, tags: newTags } };
    },
  },
};
