export default {
  path: '/',
  component: '@/layouts/Security',
  routes: [
    {
      path: '/',
      component: './Home',
    },
    {
      path: '/disk',
      name: 'disk',
      icon: 'FolderOutlined',
      component: './Home',
    },
    {
      path: '/album',
      name: 'album',
      icon: 'FileImageOutlined',
      component: './album',
    },
    {
      path: '/album/:id?',
      component: './album/id$',
    },
    {
      path: '/note',
      name: 'note',
      icon: 'HighlightOutlined',
      component: './note',
    },
    {
      path: '/note/diary',
      component: './note/diary',
    },
    {
      path: '/canvas',
      name: 'canvas',
      icon: 'NodeIndexOutlined',
      component: './canvas',
    },
    {
      path: '/canvas/:id',
      component: './canvas/id$',
    },
    {
      path: '/transmission',
      name: 'transmission',
      icon: 'SwapOutlined',
      component: './transmission',
    },
    {
      path: '/trash',
      name: 'trash',
      icon: 'RestOutlined',
      component: './Trash',
    },
    {
      path: '/account/settings',
      component: './Account',
    },
    {
      component: './404',
    },
  ],
};
