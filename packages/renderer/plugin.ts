import { IApi } from 'umi';
export default (api: IApi) => {
  api.addHTMLMetas(() => [{ name: 'foo', content: 'bar' }]);
};
