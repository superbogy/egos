import {
  DvaModel,
  EffectsMapObject,
  ReducersMapObject,
  SubscriptionAPI,
} from 'umi';

export function trim(str: string) {
  return str.trim();
}

export const mergeModel = (model: any, pagePath?: string[]) => {
  return model;
  const setup = ({ dispatch, history }: SubscriptionAPI) => {
    return history.listen(({ location }: any) => {
      console.log('merge model set up', pagePath);
      if (pagePath?.includes(location.pathname)) {
        dispatch({
          type: 'init',
          payload: location,
        });
      }
    });
  };

  return {
    ...model,
    subscriptions: {
      setup: pagePath ? setup : undefined,
      ...model.subscriptions,
    },
    reducers: {
      updateState(state: Record<string, any>, { payload }: any) {
        return { ...state, ...payload };
      },
      ...model.reducers,
    },
  };
};
