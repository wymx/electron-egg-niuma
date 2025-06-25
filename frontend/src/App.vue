<template>
  <a-config-provider :locale="zhCN">
    <router-view v-slot="{ Component }">
      <component :is="Component" />
      <div v-if="isDev"
        style="position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 5px;">
        当前路由: {{ $route.path }}
      </div>
    </router-view>
  </a-config-provider>
</template>
<script setup>
import { onMounted, ref } from 'vue';

import { Modal } from 'ant-design-vue';
import { versionCheck } from './utils/request.js'

import { ConfigProvider } from 'ant-design-vue';
const AConfigProvider = ConfigProvider;
import zhCN from 'ant-design-vue/es/locale/zh_CN';

const isDev = ref(process.env.NODE_ENV === 'development');
onMounted(() => {
  const loadingElement = document.getElementById('loadingPage');
  if (loadingElement) {
    loadingElement.remove();
  }
});
const checkAppVersion = async () => {
  try {
    var chckInfo = await versionCheck();
    if (chckInfo.showPop) {
      Modal.success({
        title: chckInfo.title,
        content: chckInfo.newInfo,
        okText: chckInfo.okText,
        okType: chckInfo.okType,
        okButtonProps: chckInfo.okButtonProps,
        closable: !chckInfo.mustDown,
        keyboard: false,
        maskClosable: false,
        onOk() {
          if (chckInfo.downloadUrl) {
            const { shell } = require('electron') // 引入 Electron 的 shell 模块
            shell.openExternal(chckInfo.downloadUrl) // 使用 openExternal 方法打开链接
          }
        },
      });
    }
  } catch (e) {
    console.error("获取用跟新失败:", e);
  }
};

checkAppVersion()

</script>
<style lang="less"></style>