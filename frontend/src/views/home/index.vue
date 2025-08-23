<template>
  <div>
    <a-space direction="horizontal" align="start">
      <!-- 微博卡片 -->
      <a-card v-if="weiboData.length > 0" title="微博" size="small" style="width: 300px">
        <div v-for="(item, index) in weiboData" :key="index" style="text-align: left; margin-bottom: 5px;">
          <a :href="item.link" target="_blank">{{ item.title }}</a>
        </div>
      </a-card>
      
      <!-- 知乎卡片 -->
      <a-card v-if="zhihuData.length > 0" title="知乎" size="small" style="width: 300px">
        <div v-for="(item, index) in zhihuData" :key="index" style="text-align: left; margin-bottom: 5px;">
          <a :href="item.link" target="_blank">{{ item.title }}</a>
        </div>
      </a-card>
      
      <!-- 抖音卡片 -->
      <a-card v-if="douyinData.length > 0" title="抖音" size="small" style="width: 300px">
        <div v-for="(item, index) in douyinData" :key="index" style="text-align: left; margin-bottom: 5px;">
          <a :href="item.link" target="_blank">{{ item.title }}</a>
        </div>
      </a-card>
      
      <!-- 今日头条卡片 -->
      <a-card v-if="toutiaoData.length > 0" title="今日头条" size="small" style="width: 300px">
        <div v-for="(item, index) in toutiaoData" :key="index" style="text-align: left; margin-bottom: 5px;">
          <a :href="item.link" target="_blank">{{ item.title }}</a>
        </div>
      </a-card>
    </a-space>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

// var hostUrl = "https://60s-cf.114128.xyz/v2";
var hostUrl = "https://60s-cf.viki.moe/v2";

var weiboData = ref([]);
var zhihuData = ref([]);
var douyinData = ref([]);
var toutiaoData = ref([]);

var list = ["weibo", "zhihu", "douyin", "toutiao"];

async function requestData(path) {
  try {
    const config = {
      method: 'get',
      url: `${hostUrl}/${path}`,
    };

    const response = await axios.request(config);
    console.log(response, "submitResponse");
    if (response.data.code == 200) {
      // 根据不同的请求路径，更新对应的数据
      switch(path) {
        case "weibo":
          weiboData.value = response.data.data;
          break;
        case "zhihu":
          zhihuData.value = response.data.data;
          break;
        case "douyin":
          douyinData.value = response.data.data;
          break;
        case "toutiao":
          toutiaoData.value = response.data.data;
          break;
      }
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
  }
}

// 使用 onMounted 生命周期钩子来发起请求
onMounted(() => {
  // 分别发起请求，不需要等待所有请求完成
  list.forEach(item => requestData(item));
});
</script>

<style scoped>
/* 添加一些基本样式 */
a-space {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
</style>