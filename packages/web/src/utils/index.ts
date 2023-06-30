import type { Model } from "dva";

export const BaseModel: Model = {
  namespace: '',
  state: {
  },
  effects: {},
  reducers: {
    updateState(state: Record<string, any>, { payload }: { payload: Record<string, any> }) {
      return { ...state, ...payload }
    }
  }
}
export const mergeModel = (model: Model) => {
  console.log('shit', model);
  return {
    ...BaseModel,
    ...model,
  };
}


export const truncate = (str: string, restrict: number, ellipsis = '...') => {
  if (!str) {
    return str;
  }
  if (str.length > restrict) {
    return [str.substring(0, restrict), ellipsis]
  }
  return str;
}
