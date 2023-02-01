export default {
  path: '/',
  component: '@/layouts/Basic',
  routes: [
    {
      path: '/',
      component: '@/pages/Home',
    },
    {
      path: '/disk',
      name: 'disk',
      icon: 'FolderOutlined',
      component: '@/pages/Home',
    },

    {
      path: '/account/setting',
      name: 'setting',
      component: '@/pages/account',
    },
  ],
};
