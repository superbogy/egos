import { getSharedVar, setSharedVar } from '../global';
import crypto from 'crypto';

export const getTaskSecretKey = (taskId: number) => {
  return ['task', 'secret', 'key', taskId].join(':');
};
export const getTaskPassword = (taskId: number) => {
  const key = getTaskSecretKey(taskId);
  const pwd = getSharedVar(key);
  return pwd;
};

export const getTaskSecret = (taskId: number) => {
  const pwd = getTaskPassword(taskId);
  if (!pwd) {
    return null;
  }
  const hash = crypto.createHash('sha1');
  return hash.update(pwd).digest('hex').substring(16, 32);
};

export const setTaskSecret = (taskId: number, pass: string) => {
  const key = getTaskSecretKey(taskId);
  console.log(key);
  setSharedVar(key, pass);
};
