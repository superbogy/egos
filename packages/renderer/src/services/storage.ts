import { toObject } from '../lib/helper';

const KEY_PREFIX = '2gos-user-action-data';
const getUserKey = (page: string) => {
  const user = { username: 'egos' };
  return [KEY_PREFIX, String(user.username), page].join('-');
};
export default {
  setUserData(page: string, action: string, data: any) {
    const current = this.getUserData(page);
    const newItem = JSON.stringify({ ...current, [action]: data });
    const key = getUserKey(page);
    localStorage.setItem(key, newItem);
  },
  getUserData(page: string, action = '') {
    const data = localStorage.getItem(getUserKey(page));
    if (!data) {
      return null;
    }
    const obj = toObject(data);
    if (action && obj) {
      return obj[action];
    }
    return obj;
  },
};
