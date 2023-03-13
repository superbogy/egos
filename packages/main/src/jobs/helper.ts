import { getSharedVar } from '../global';
import { md5 } from '@egos/storage';

export const getTaskSecretKey = (taskId: number) => {
  return ['encrypt', 'task', 'secret', 'key', taskId].join(':');
};

export const getTaskSecret = (taskId: number) => {
  const key = getTaskSecretKey(taskId);
  const pwd = getSharedVar(key);
  if (!pwd) {
    return null;
  }
  return md5(pwd);
};
