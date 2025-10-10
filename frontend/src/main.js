import * as AntIcon from '@ant-design/icons-vue';
import Antd from 'ant-design-vue';
import { createApp } from 'vue';
import App from './App.vue';
import './assets/global.less';
import components from './components/global';
import Router from './router/index';


// 设置初始主题
function setInitialTheme() {
  const savedTheme = localStorage.getItem('app-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme) {
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
  } else if (prefersDark) {
    document.body.classList.add('dark-theme');
    localStorage.setItem('app-theme', 'dark');
  }
}

// setInitialTheme();
const app = createApp(App)

// components
for (const i in components) {
  app.component(i, components[i])
}

// icon
for (const i in AntIcon) {
  const whiteList = ['createFromIconfontCN', 'getTwoToneColor', 'setTwoToneColor', 'default']
  if (!whiteList.includes(i)) {
    app.component(i, AntIcon[i])
  }
}
app.config.globalProperties.$icons = AntIcon

app.use(Antd).use(Router).mount('#app')
