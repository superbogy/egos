export default {
  namespace: 'global',
  state: {
    num: 0,
    translateResult: null,
  },
  reducers: {
    add(state: any) {
      state.num += 1;
    },
  },
  effects: {
    *addAsync(_action: any, { put }: any) {
      yield put({ type: 'add' });
    },
  },
};
