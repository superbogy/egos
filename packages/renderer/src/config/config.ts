import { defineConfig } from 'umi';

export default defineConfig({
  title: 'egos',
  manifest: {
    basePath: '/',
  },
  headScripts: [{ src: './renderer.js' }],
  chainWebpack: (config, { webpack }) => {
    config.target('electron-renderer');
    // mfsu
    config.module
      .rule('mjs-rule')
      .test(/.m?js/)
      .resolve.set('fullySpecified', false);
  },
});
