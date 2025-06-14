<template>
    <div class="layout-container">
        <!-- 顶部导航栏 -->
        <div class="header">
            <a-input v-model:value="result.mobile" placeholder="phone" @change="handleMobileChange">
                <template #prefix>
                    <user-outlined />
                </template>
            </a-input>
            <a-input-password v-model:value="result.password" placeholder="password" @change="handlePasswordChange">
                <template #prefix>
                    <lock-outlined />
                </template>
            </a-input-password>
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
                        <a-menu-item key="/qdAuto" v-if="level >= 0">
                            <template #icon>
                                <unordered-list-outlined />
                            </template>
                            清单
                        </a-menu-item>
                        <a-menu-item v-if="showAsk" key="/autoAsk">
                            <template #icon>
                                <message-outlined />
                            </template>
                            自动回复
                        </a-menu-item>
                        <a-sub-menu key="sub2" v-if="level >= 10">
                            <template #icon>
                                <picture-outlined />
                            </template>
                            <template #title>图片操作</template>
                            <a-menu-item key="/tinyImage" v-if="level >= 10">
                                <file-zip-outlined /> 压缩图片</a-menu-item>
                            <a-menu-item key="/upImage" v-if="level >= 12"><up-square-outlined /> 上传图片</a-menu-item>
                        </a-sub-menu>
                        <a-sub-menu key="sub1">
                            <template #icon>
                                <setting-outlined />
                            </template>
                            <template #title>其他操作</template>
                            <a-menu-item key="/updater" v-if="level >= 9"><tool-outlined /> 常用工具</a-menu-item>
                            <a-menu-item key="/gameWeb" v-if="level >= 99"><fire-outlined /> h5game</a-menu-item>
                            <a-menu-item @click="closeApp"><logout-outlined /> 退出程序</a-menu-item>
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
import { message } from 'ant-design-vue';
import { askUserList, versionCheck,loginUser,currentUserInfo } from '../utils/request.js'
import { submitQingdan } from '../utils/defualData.js'
var result = reactive(jsyaml.load(submitQingdan));
const router = useRouter();
const route = useRoute(); // 获取当前路由
const selectedKeys = ref([route.path]); // 初始化为当前路径

const collapsed = ref(false);
let showAsk = ref(false);
let openUrl = ref(false);
let level = ref(0);


// 监听路由变化更新菜单选中状态
watch(() => route.path, (newPath) => {
    selectedKeys.value = [newPath];
});


const closeApp = () => {
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('app-quit');
}

const allResult = ref(localStorage.getItem("allResult") || "{}");
const allData = JSON.parse(allResult.value);
const mobile = ref(allData.mobile || "");
const password = ref(allData.password || "");
result.mobile = mobile.value;
result.password = password.value;
const validateAndSave = () => {
    if (result.mobile && result.mobile.length > 0 &&
        result.password && result.password.length > 0) {
        localStorage.setItem("allResult", JSON.stringify(result));
        // 可以在这里添加其他需要触发的逻辑
        // 例如自动检查用户权限
        getUserListShowAsk();
        getUserListShowAsk();
        getNumberInfo();
    }
};

const handleMobileChange = () => {
    validateAndSave();
};

const handlePasswordChange = () => {
    validateAndSave();
};

const validateCredentials = () => {
    if (!result.mobile || result.mobile.length < 1) {
        message.warning('没有手机号');
        return false;
    }
    if (!result.password || result.password.length < 1) {
        message.warning("没有密码");
        return false;
    }
    if (!openUrl.value) {
        message.warning("检查手机号和密码是否正确");
        return false;
    }

    return true;
};
const handleMenuClick = ({ key }) => {

    if (key == '/qdAuto') {
        if (!validateCredentials()) return;
        router.push(key);
    } else if (key == '/autoAsk') {

        if (!validateCredentials()) return;
        const menuInfo = {
            name: "HomeAutoAsk",
            query: { mobile: result.mobile, password: result.password }
        }
        router.push(menuInfo);
    } else {
        router.push(key);
    }
    getUserListShowAsk();
};

const getUserListShowAsk = async () => {
    try {
        var userInfo = await askUserList();
        showAsk.value = false;
        if (userInfo.showAll) {
            showAsk.value = true;
        }
        if (userInfo.levelAll) {
            level.value = userInfo.levelAll;
        }
        if (userInfo.userList && userInfo.userList.length > 0) {
            userInfo.userList.forEach(item => {
                if (item.mobile === result.mobile) {
                    showAsk.value = true;
                    level.value = item.level ? item.level : level.value;
                }
            });
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

const getNumberInfo = async () => {
    try {
        const response = await loginUser({
            mobile: result.mobile,
            password: result.password
        });
        localStorage.setItem("usertoken", response)
        if (response) {
            const response = await currentUserInfo();
            if (response) {
                openUrl.value = true;
            } else {
                openUrl.value = false;
            }
        } else {
            openUrl.value = false;
        }
    } catch (e) {
        console.error("获取数量信息失败:", e);
        openUrl.value = false;
        localStorage.setItem("usertoken", "")
    }
};

// onMounted(async () => {
getUserListShowAsk();
checkAppVersion();
getNumberInfo();
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
    /* background: #001529; */
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    /* padding: 0 24px; */
}

.user-info {
    display: flex;
    align-items: center;
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