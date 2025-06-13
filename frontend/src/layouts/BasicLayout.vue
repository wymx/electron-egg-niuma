<template>
    <div class="layout-container">
        <!-- 顶部导航栏 -->
        <div class="header">
            <!-- <div class="logo">管理后台</div>
            <div class="user-info">
                <span>xxxx</span>
                <a-button @click="logout">退出程序</a-button>
            </div> -->
        </div>

        <div class="main-container">
            <!-- 侧边菜单 -->
            <div class="sidebar">
                <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible>
                    <div style="display: flex;align-items: center;width: 100%;height: 64px;justify-content: center;">
                        <div v-if="!collapsed" class="logo">牛马工具</div>
                        <div style="margin:0 16px;">
                            <menu-unfold-outlined v-if="collapsed" class="trigger"
                                @click="() => (collapsed = !collapsed)" />
                            <menu-fold-outlined v-else class="trigger" @click="() => (collapsed = !collapsed)" />
                        </div>
                    </div>
                    <a-menu v-model:selectedKeys="selectedKeys" mode="inline" @click="handleMenuClick">
                        <a-menu-item key="/home">
                            <template #icon>
                                <home-outlined />
                            </template>
                            首页
                        </a-menu-item>
                        <a-menu-item v-if="showAsk" key="/autoAsk">
                            <template #icon>
                                <message-outlined />
                            </template>
                            自动回复
                        </a-menu-item>
                        <a-sub-menu key="sub2">
                            <template #icon>
                                <setting-outlined />
                            </template>
                            <template #title>图片操作</template>
                            <a-menu-item key="/tinyImage">压缩图片</a-menu-item>
                            <a-menu-item key="/upImage">上传图片</a-menu-item>
                        </a-sub-menu>
                        <a-sub-menu key="sub1">
                            <template #icon>
                                <setting-outlined />
                            </template>
                            <template #title>其他操作</template>
                            <a-menu-item key="/updater">常用工具</a-menu-item>
                            <a-menu-item @click="closeApp">退出程序</a-menu-item>
                        </a-sub-menu>
                    </a-menu>
                </a-layout-sider>
            </div>

            <!-- 内容区域 -->
            <div class="content">
                <router-view />
            </div>
        </div>
    </div>
</template>

<script setup>
import jsyaml from 'js-yaml';
import { ref, watch, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router'; // 添加 useRoute
import {
    HomeOutlined,
    MessageOutlined,
    SettingOutlined
} from '@ant-design/icons-vue';
import { loginUser, submitInfo, currentUserInfo, useMessageAI, numberInfo, askUserList, versionCheck } from '../utils/request.js'
import { submitQingdan } from '../utils/defualData.js'
var result = reactive(jsyaml.load(submitQingdan));
const router = useRouter();
const route = useRoute(); // 获取当前路由
const selectedKeys = ref([route.path]); // 初始化为当前路径

const collapsed = ref(false);
let showAsk = ref(false);

// 监听路由变化更新菜单选中状态
watch(() => route.path, (newPath) => {
    selectedKeys.value = [newPath];
});

const handleMenuClick = ({ key }) => {
    router.push(key);
};

const closeApp = () => {
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('app-quit');
}

const allResult = ref(localStorage.getItem("allResult") || "{}");
const allData = JSON.parse(allResult.value);
const mobile = ref(allData.mobile || "");
result.mobile = mobile.value;
const getUserListShowAsk = async () => {
    try {
        var userInfo = await askUserList();
        if (userInfo.showAll) {
            showAsk.value = true;
        } else {
            showAsk.value = userInfo.userList.some(item => item.mobile === result.mobile);
        }
    } catch (e) {
        console.error("获取用户列表失败:", e);
    }
};


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
                        openLink(chckInfo.downloadUrl);
                    }
                    checkAppVersion()
                },
            });
        }
    } catch (e) {
        console.error("获取用跟新失败:", e);
    }
};

// onMounted(async () => {
getUserListShowAsk();
checkAppVersion()
// });

</script>

<style scoped>
.logo {
    width: 100%;
    height: 32px;
    background: rgba(31, 208, 99, 0.3);
    margin-left: 16px;
    justify-content: center;
    align-items: center;
    display: flex;
}

.layout-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
}

.header {
    /* height: 48px; */
    background: #001529;
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.main-container {
    display: flex;
    flex: 1;
    overflow: hidden;
}

.sidebar {
    /* width: 200px; */
    background: #fff;
    border-right: 1px solid #e8e8e8;
}

.content {
    flex: 1;
    padding: 16px;
    overflow: auto;
}
</style>