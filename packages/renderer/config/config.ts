import { defineConfig } from 'umi';
import router from './router';

console.log([
  {
    component: './404',
  },
]);
export default defineConfig({
  antd: {},
  access: {},
  model: {},
  dva: {},
  initialState: {},
  request: {},
  layout: false,
  clientLoader: {},
  npmClient: 'pnpm',
  title: 'egos',
  // base: './',
  // manifest: {
  //   basePath: '/',
  // },
  routes: [
    router,
    {
      component: './404',
    },
  ],
  // routes: [
  //   {
  //     exact: false,
  //     path: '/',
  //     component: '@/layouts/index',
  //     routes: [{ exact: true, path: '/', component: '@/pages/index' }],
  //   },
  // ],
  // chainWebpack: (config, { webpack }) => {
  //   config.target('electron-renderer');
  //   // mfsu
  //   config.module
  //     .rule('mjs-rule')
  //     .test(/.m?js/)
  //     .resolve.set('fullySpecified', false);
  // },
});
