import { LRUCache } from 'lru-cache';

export default global;

const shared = new LRUCache({
  ttl: 30 * 60 * 100,
  max: 500,
  updateAgeOnGet: true,
});
(global as any).shared = shared;

export const setSharedVar = (name: string, val: any) => {
  shared.set(name, val);
};

export const getSharedVar = (name: string) => {
  shared.get(name);
  return shared.get(name) as string;
};
