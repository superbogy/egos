import { RequestConfig } from 'umi';
import { message } from 'antd';

// request.interceptors.request.use((url, options) => {
//   console.log('request---->', url, options, window.location);
//   return {
//     url: `http://${window.location.hostname}:6789${url}`,
//     options: { ...options },
//   };
// });

export const request: RequestConfig = {
  timeout: 1000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },

  errorConfig: {},
  // 请求拦截器
  requestInterceptors: [
    (config: any) => {
      // 拦截请求配置，进行个性化处理。
      const url = `http://${window.location.hostname}:6789${config.url}`;
      return { ...config, url };
    },
  ],

  // 响应拦截器
  responseInterceptors: [
    (response) => {
      // 拦截响应数据，进行个性化处理
      const { data } = response as any;
      console.log(data);
      if (!data) {
        message.error('请求失败！');
      }
      return response;
    },
  ],
};
