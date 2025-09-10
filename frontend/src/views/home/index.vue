<template>
    <div>
        <div>热点汇总</div>
        <a-space direction="horizontal" align="start" wrap>
            <!-- bili卡片 -->
            <a-card v-if="biliData.length > 0" title="bili" size="small" class="hot-card">
                <div v-for="(item, index) in biliData" :key="index" class="hot-item">
                    <img v-if="item.cover" :src="item.cover" alt="" class="hot-item-img">
                    <a :href="item.link" target="_blank" class="hot-item-link">{{ item.title }}</a>
                </div>
            </a-card>

            <!-- 微博卡片 -->
            <a-card v-if="weiboData.length > 0" title="微博" size="small" class="hot-card">
                <div v-for="(item, index) in weiboData" :key="index" class="hot-item">
                    <img v-if="item.cover" :src="item.cover" alt="" class="hot-item-img">
                    <a :href="item.link" target="_blank" class="hot-item-link">{{ item.title }}</a>
                </div>
            </a-card>

            <!-- 知乎卡片 -->
            <a-card v-if="zhihuData.length > 0" title="知乎" size="small" class="hot-card">
                <div v-for="(item, index) in zhihuData" :key="index" class="hot-item">
                    <img v-if="item.cover" :src="item.cover" alt="" class="hot-item-img">
                    <a :href="item.link" target="_blank" class="hot-item-link">{{ item.title }}</a>
                </div>
            </a-card>

            <!-- 抖音卡片 -->
            <a-card v-if="douyinData.length > 0" title="抖音" size="small" class="hot-card">
                <div v-for="(item, index) in douyinData" :key="index" class="hot-item">
                    <img v-if="item.cover" :src="item.cover" alt="" class="hot-item-img">
                    <a :href="item.link" target="_blank" class="hot-item-link">{{ item.title }}</a>
                </div>
            </a-card>

            <!-- 今日头条卡片 -->
            <a-card v-if="toutiaoData.length > 0" title="今日头条" size="small" class="hot-card">
                <div v-for="(item, index) in toutiaoData" :key="index" class="hot-item">
                    <img v-if="item.cover" :src="item.cover" alt="" class="hot-item-img">
                    <a :href="item.link" target="_blank" class="hot-item-link">{{ item.title }}</a>
                </div>
            </a-card>

            <!-- 肯德基卡片 -->
            <a-card v-if="kfcData" size="small" class="hot-card">
                <div class="kfc-content">
                    <div :class="['kfc-text', { 'expanded': isKfcExpanded }]" :title="kfcData.kfc">
                        {{ kfcData.kfc }}
                    </div>
                    <a v-if="kfcData.kfc && kfcData.kfc.length > 50" @click="toggleKfcExpand" class="expand-link">
                        {{ isKfcExpanded ? '收起' : '展开' }}
                    </a>
                </div>
            </a-card>

        </a-space>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

// https://docs.60s-api.viki.moe
// var hostUrl = "https://60s.viki.moe/v2";
// var hostUrl = "https://60s-cf.viki.moe/v2";
var hostUrl = "https://60s-cf.114128.xyz/v2";


// 为每个数据源创建独立的 ref
const biliData = ref([]);
const weiboData = ref([]);
const zhihuData = ref([]);
const douyinData = ref([]);
const toutiaoData = ref([]);
const kfcData = ref();

var list = ["bili", "weibo", "zhihu", "douyin", "toutiao", "kfc"];

// 肯德基文本展开状态
const isKfcExpanded = ref(false);


// 切换肯德基文本展开状态
function toggleKfcExpand() {
    isKfcExpanded.value = !isKfcExpanded.value;
}

// function openInBrowser(url) {
//   if (url) { 
//     const { shell } = require("electron");
//     url = url.replace("https://api.zhihu.com/questions", "https://www.zhihu.com/question");
//     shell.openExternal(url);
//   } 
// } 
async function requestData(path) {
    try {

        if (path === "bili") {
            // 如果B站数据为空，尝试使用备用接口获取数据
            await getBili();
        }

        const config = {
            method: 'get',
            url: `${hostUrl}/${path}`,
        };

        const response = await axios.request(config);
        if (response.data.code == 200) {
            // 根据路径更新对应的 ref 数据
            switch (path) {
                case "bili":
                    // biliData.value = response.data.data || [];
                    break;
                case "weibo":
                    weiboData.value = response.data.data || [];
                    break;
                case "zhihu":
                    zhihuData.value = (response.data.data || []).map(item => ({
                        ...item,
                        link: item.link.replace("https://api.zhihu.com/questions", "https://www.zhihu.com/question")
                    }));
                    break;
                case "douyin":
                    douyinData.value = response.data.data || [];
                    break;
                case "toutiao":
                    toutiaoData.value = response.data.data || [];
                    break;
                case "kfc":
                    const today = new Date();
                    var day = today.getDay() === 4;
                    if (day) {
                        kfcData.value = response.data.data || "";
                    }
                    break;
            }
        }
    } catch (error) {
        console.error("Error fetching user info:", error);
    }
}

// 获取B站热门数据的函数 - 改进版
async function getBili() {
    try {
        const { ipcRenderer } = require("electron");
        var response = await ipcRenderer.invoke("api-user-request", {
            url: `https://api.bilibili.com/x/web-interface/popular?ps=20`,
            method: "GET",
            data: {},
        });
        if (response.code === 0 && response.data && response.data.list) {
            // 提取需要的字段并格式化
            const basicData = response.data.list.map(item => ({
                title: item.title,
                link: `https://www.bilibili.com/video/${item.bvid}`,
                cover: `https://images.weserv.nl/?url=${encodeURIComponent(item.pic)}&weboptimization=true`
            }));
            biliData.value = basicData;

            // 异步处理图片URL
            // await processAllBilibiliImages(basicData, response.data.list);
        }

        console.log("biliData:", biliData.value);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}
// 批量处理所有B站图片
async function processAllBilibiliImages(basicData, originalItems) {
    try {
        // 创建所有图片处理Promise
        const imagePromises = originalItems.map((item, index) =>
            processBilibiliImage(item.pic, item.bvid).then(base64Url => {
                // 更新对应项的图片URL
                if (basicData[index]) {
                    basicData[index].cover = base64Url;
                }
                return base64Url;
            })
        );

        // 等待所有图片处理完成
        await Promise.all(imagePromises);

        // 触发响应式更新
        biliData.value = [...basicData];
    } catch (error) {
        console.error("Error processing Bilibili images:", error);
    }
}
// 处理单个B站图片URL的函数
async function processBilibiliImage(picUrl, bvid) {
    if (!picUrl) return '';

    try {
        // 构建完整URL
        let fullUrl = picUrl;
        if (picUrl.startsWith('//')) {
            fullUrl = 'https:' + picUrl;
        } else if (!picUrl.startsWith('http')) {
            fullUrl = 'https:' + picUrl;
        }
        // 通过Electron主进程获取图片并转为Base64
        const { ipcRenderer } = require("electron");
        const base64Image = await ipcRenderer.invoke("get-bilibili-image", fullUrl);


        if (base64Image) {
            return `data:image/jpeg;base64,${base64Image}`;
        } else {
            // 如果获取失败，返回默认图片
            return '';
        }
    } catch (error) {
        console.error("Error processing image for", bvid, ":", error);
        return '';
    }
}

onMounted(() => {
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

/* 热门卡片样式 */
.hot-card {
    width: 300px;
}

/* 热门项样式 */
.hot-item {
    display: flex;
    align-items: flex-start;
    text-align: left;
    margin-bottom: 8px;
}

/* 热门项图片样式 */
.hot-item-img {
    width: 32px;
    height: 32px;
    margin-right: 8px;
    flex-shrink: 0;
    object-fit: cover;
}

/* 热门项链接样式 */
.hot-item-link {
    flex: 1;
    line-height: 1.4;
    text-decoration: none;
    color: #1890ff;
}

.hot-item-link:hover {
    text-decoration: underline;
}

/* 肯德基内容样式 */
.kfc-content {
    display: flex;
    align-items: flex-start;
}

.kfc-text {
    flex: 1;
    line-height: 1.4;
    word-wrap: break-word;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2; /* 添加标准属性 */
    overflow: hidden;
    text-overflow: ellipsis;
}

.kfc-text.expanded {
    display: block;
    -webkit-line-clamp: unset;
    line-clamp: unset; /* 同步更新 */
}

.expand-link {
    color: #1890ff;
    margin-left: 5px;
    cursor: pointer;
    flex-shrink: 0;
    text-decoration: none;
}

.expand-link:hover {
    text-decoration: underline;
}
</style>