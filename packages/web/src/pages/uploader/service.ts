import { request } from 'umi';
import queryString from 'query-string';

export const query = async (payload: { id: string, token: string, type: string }) => {
  const qs = queryString.stringify(payload);
  return request(`/api/uploader?${qs}`)
}
