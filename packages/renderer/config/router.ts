export default {
  path: '/',
  component: '@/layouts/Basic',
  routes: [
    // {
    //   path: '/',
    //   component: '@/pages/Home',
    // },
    {
      path: '/',
      name: 'disk',
      icon: 'FolderOutlined',
      component: '@/pages/netdisk',
    },
    {
      path: '/album',
      name: 'album',
      icon: 'CameraFilled',
      component: '@/pages/album',
    },
    {
      path: '/album/:id',
      name: 'album-info',
      component: '@/pages/album/id$',
    },
    {
      path: '/account/setting',
      name: 'setting',
      component: '@/pages/account',
    },
  ],
};
