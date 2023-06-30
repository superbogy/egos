
import { request } from 'umi';
import queryString from 'query-string';

export const query = async (payload: { token: string }) => {
  const qs = queryString.stringify(payload)
  return request(`/api/share?${qs}`)
}

export const getFileObj = async (payload: any) => {
  const qs = queryString.stringify(payload)
  return request(`/api/share/view?${qs}`);
}
