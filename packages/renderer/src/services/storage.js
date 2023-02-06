import { canJson, toObject } from '../lib/helper';

export default {
  setUserData(page, action, data) {
    const current = this.getUserData(page);
    const newItem = JSON.stringify({ ...current, [action]: data });
    const key = getUserKey(page);
    localStorage.setItem(key, newItem);
  },
  getUserData(page, action = '') {
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
