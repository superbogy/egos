import { defineConfig } from 'umi';
import type { IConfig } from '@umijs/preset-umi';

const config: IConfig = {
  history: { type: 'hash' },
  dva: {},
  antd: {},
  access: {},
  npmClient: 'pnpm',
  title: 'egos',
  locale: {
    default: 'zh-CN',
    baseSeparator: '-',
  },
  historyWithQuery: {},
  routes: [
    {
      path: '/',
      component: '@/layouts/basic',
      routes: [
        { path: '/share', component: '@/pages/share' },
        { path: '/share/view', component: '@/pages/share/view' },
        { path: '/uploader', component: '@/pages/uploader' },
        { path: '/album', component: '@/pages/album' },
      ],
    },
    {
      component: '@/pages/404',
    },
  ],
  request: {
    dataField: 'data',
  },
};

export default config;
