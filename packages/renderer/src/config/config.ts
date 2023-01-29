import { defineConfig } from 'umi';

export default defineConfig({
  // title: 'egos',
  // base: './',
  // manifest: {
  //   basePath: '/',
  // },
  dynamicImport: false,
  routes: [
    {
      exact: false,
      path: '/',
      component: '@/layouts/index',
      routes: [{ exact: true, path: '/', component: '@/pages/index' }],
    },
  ],
  // chainWebpack: (config, { webpack }) => {
  //   config.target('electron-renderer');
  //   // mfsu
  //   config.module
  //     .rule('mjs-rule')
  //     .test(/.m?js/)
  //     .resolve.set('fullySpecified', false);
  // },
});
