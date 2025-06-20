/**
 * 基础路由
 * @type { *[] }
 */
const constantRouterMap = [
  {
    path: "/",
    component: () => import("@/layouts/BasicLayout.vue"),
    redirect: "/home",
    children: [
      {
        path: "/home",
        name: "HomeIndex",
        component: () => import("@/views/home/index.vue"),
        meta: { title: "首页" },
      },
      {
        path: "/qdAuto",
        name: "HomeHome",
        component: () => import("@/views/home/home.vue"),
        meta: { title: "清单" },
      },
      {
        path: "/autoAsk",
        name: "HomeAutoAsk",
        component: () => import("@/views/home/autoAsk.vue"),
        props: true,
        meta: { title: "自动回复" },
      },
      {
        path: "/aiWeb",
        name: "AiWeb",
        component: () => import("@/views/framework/aiWeb.vue"),
        props: true,
        meta: { title: "AI网页" },
      },
      {
        path: "/hidenInfo",
        name: "HidenInfo",
        component: () => import("@/views/image/hidenInfo.vue"),
        props: true,
        meta: { title: "信息隐写" },
      },
      {
        path: "/tinyImage",
        name: "TinyImage",
        component: () => import("@/views/image/tinyImage.vue"),
        props: true,
        meta: { title: "图片压缩" },
      },
      {
        path: "/upImage",
        name: "UpImage",
        component: () => import("@/views/image/upImage.vue"),
        props: true,
        meta: { title: "上传图片" },
      },
      {
        path: "/updater",
        name: "FrameworkUpdaterIndex",
        component: () => import("@/views/framework/updater/Index.vue"),
        meta: { title: "更新信息" },
      },
      {
        path: "/gameWeb",
        name: "FrameworkGameWeb",
        component: () => import("@/views/framework/gameWeb.vue"),
        meta: { title: "更新信息" },
      },
      {
        path: "/workTime",
        name: "WorkTime",
        component: () => import("@/views/vip/workTime.vue"),
        meta: { title: "更新信息" },
      },
    ],
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login.vue"),
    meta: { hidden: true },
  },
];

export default constantRouterMap;
