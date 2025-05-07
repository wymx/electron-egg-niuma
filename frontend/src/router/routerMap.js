/**
 * 基础路由
 * @type { *[] }
 */

const constantRouterMap = [
  {
    path: '/',
    name: '',
    redirect: { name: 'hello' },
    children: [
      // {
      //   path: '/',
      //   name: 'ExampleHelloIndex',
      //   component: () => import('@/views/example/hello/Index.vue')
      // },
      {
        path: '/example',
        name: 'hello',
        component: () => import('@/views/home/home.vue')
      },
    ]
  },
]

export default constantRouterMap