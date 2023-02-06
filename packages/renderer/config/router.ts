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
      component: '@/pages/netdisk',
    },

    {
      path: '/account/setting',
      name: 'setting',
      component: '@/pages/account',
    },
  ],
};
