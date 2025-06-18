<template>
    <div class="ai-web-container">
        <!-- 顶部导航区域 -->
        <Card :bordered="false" class="nav-card">
            <Space size="large">
                <Button type="primary" @click="openLink('https://chat.deepseek.com')">
                    DeepSeek
                </Button>
                <Button type="primary" @click="openLink('https://www.tongyi.com')">
                    通义千问
                </Button>
                <Button type="primary" @click="openLink('https://www.doubao.com/chat/')">
                    豆包
                </Button>
                <Button type="primary" @click="openLink('https://chatglm.cn')">
                    智谱清言
                </Button>
                <Button type="primary" @click="openLink('https://www.kimi.com/')">
                    kimi
                </Button>
            </Space>
        </Card>

        <!-- iframe 展示区域 -->
        <Card :bordered="false" class="iframe-card">
            <iframe src="https://ai-bot.cn/" frameborder="0" allowfullscreen class="iframe-content"></iframe>
        </Card>

    </div>
</template>
<script setup>
import { Card, Button, Space } from 'ant-design-vue';
const openLink = (url) => {
    window.open(url, '_blank');
};
</script>
<style lang="less" scoped>
.ai-web-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 16px;

    .nav-card {
        margin-bottom: 16px;

        :deep(.ant-card-body) {
            padding: 12px 24px;
        }
    }

    .iframe-card {
        flex: 1;

        :deep(.ant-card-body) {
            padding: 0;
            height: 100%;
        }
    }

    .iframe-content {
        width: 100%;
        height: 100%;
        border-radius: 8px;
    }
}
</style>