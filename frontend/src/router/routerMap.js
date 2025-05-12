/**
 * 基础路由
 * @type { *[] }
 */

const constantRouterMap = [
  {
    path: '/',
    name: '',
    redirect: { name: 'Home' },
    children: [
      {
        path: '/home',
        name: 'Home',
        component: () => import('@/views/home/home.vue')
      },
      {
        path: '/home/autoAsk',
        name: 'HomeAutoAsk',
        component: () => import('@/views/home/autoAsk.vue'),
        props: true

      },
      {
        path: '/framework/updater/index',
        name: 'FrameworkUpdaterIndex',
        component: () => import('@/views/framework/updater/Index.vue')
      },
    ]
  },
]

export default constantRouterMap