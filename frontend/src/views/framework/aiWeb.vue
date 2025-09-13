<template>
    <div class="ai-web-container">
        <Card :bordered="false" class="nav-card">
            <Space size="large">
                <Button type="primary" @click="closeUrlWindow" size="small" style="margin-left: 10px;">
                    关闭弹窗
                </Button>
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
                <Button type="primary" @click="visible = true">显示提示词</Button>

            </Space>
        </Card>

        <!-- 表格弹窗 -->
        <Modal v-model:visible="visible" title="参考模版" width="1000px" :footer="null">
            <a-table :columns="columns" :dataSource="dataSource" :pagination="false" :expandedRowKeys="expandedKeys"
                :expandIcon="() => null" size="middle">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'action'">
                        <a-button type="link" @click="copyContent(record.details)" size="small">
                            <CopyOutlined /> 复制
                        </a-button>
                    </template>
                    <template v-if="column.key === 'expand'">
                        <a-button type="link" @click="toggleExpand(record.key)" size="small">
                            {{ expandedKeys.includes(record.key) ? '收起' : '展开' }}
                        </a-button>
                    </template>
                </template>
                <template #expandedRowRender="{ record }">
                    <codemirror :modelValue="record.details" :disabled="false" :indentWithTab="true"
                        :extensions="extensions" :placeholder="'请输入yaml配置'" :tabSize="2"
                        style="resize: none; text-align: left; width: 100%;"
                        @update:modelValue="val => record.details = val" />
                </template>
            </a-table>
        </Modal>

        <!-- iframe 展示区域 -->
        <Card :bordered="false" class="iframe-card">
            <iframe src="https://ai-bot.cn/" frameborder="0" allowfullscreen class="iframe-content"></iframe>
        </Card>
    </div>
</template>

<script setup>
import { Card, Button, Space, Modal, Table as ATable, message } from 'ant-design-vue';
import { ref } from 'vue';
import { Codemirror } from 'vue-codemirror'
import { yaml } from '@codemirror/lang-yaml'
import { tags } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'
import { autocompletion } from '@codemirror/autocomplete'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'

const { ipcRenderer } = require("electron");
import { templateList } from '../../utils/request.js'
const openLink = (url) => {
    ipcRenderer.invoke("open-link-in-window", url);
    // window.open(url, '_blank');
};

const closeUrlWindow = () => {
    ipcRenderer.invoke("close-url-window");
};

const visible = ref(false);
const expandedKeys = ref([]);

// 创建高亮样式（优先级高于theme）
const yamlHighlight = HighlightStyle.define([
    { tag: tags.propertyName, color: "#000" }, // 属性名✅
    { tag: tags.string, color: "#cb8748" },       // 字符串✅
    { tag: tags.comment, color: "#aaa" },      // 注释✅
    { tag: tags.number, color: "#0185ca" },       //
    { tag: tags.bool, color: "#d7cd61" }          //
])

// 配置顺序调整
const extensions = [
    EditorView.lineWrapping,
    autocompletion(),
    yaml(),
    syntaxHighlighting(yamlHighlight), // 添加语法高亮
]

const copyContent = (text) => {
    navigator.clipboard.writeText(text)
        .then(() => message.success('复制成功'))
        .catch(() => message.error('复制失败'));
};

const columns = [
    {
        title: '序号',
        dataIndex: 'key',
        key: 'key',
        width: 80,
    },
    {
        title: '清单内容',
        dataIndex: 'details',
        key: 'details',
        ellipsis: true,
    },
    {
        title: '操作',
        key: 'action',
        width: 100,
    },
    {
        title: ' ',
        key: 'expand',
        width: 80,
    },
];



const dataSource = ref([]);

// 展开/收起逻辑保持不变
const toggleExpand = (key) => {
    if (expandedKeys.value.includes(key)) {
        expandedKeys.value = expandedKeys.value.filter(k => k !== key);
    } else {
        expandedKeys.value = [...expandedKeys.value, key];
    }
};

const tempList = async () => {
    try {
        dataSource.value = await templateList();
    } catch (e) {
        console.error("获取用户列表失败:", e);
    }
};
tempList();

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

// 表格样式调整
:deep(.ant-table) {
    .ant-table-expanded-row {
        background: #fafafa;
    }

    .ant-table-cell {
        padding: 12px 16px;
    }
}
</style>