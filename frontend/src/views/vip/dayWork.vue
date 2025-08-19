<template>
    <div>
        <a-card size="small">
            <div style="display: flex;align-items: center;width: 80%;text-align: left;">
                <div v-for="(item, index) in allTemples" :key="item"
                    style="display: flex;flex-direction: column;margin-left: 8px;width:100px">
                    <a-input type="text" v-model:value="item.name" style="width:100%;margin-right:5px"
                        @blur="saveLocalStorage" />
                    <div style="display: flex;flex-direction: row;justify-content: space-between;margin-top: 5px;">
                        <a-button type="primary" size="small" @click="useTemple(index)">使用</a-button>
                        <a-button type="primary" size="small" danger @click="deleteTemple(index)">删除</a-button>
                    </div>
                </div>
                <a-button type="primary" size="small" @click="saveCurrentTemple"
                    style="margin-left: 20px;">保存当前配置为模版</a-button>
            </div>
            <a-space direction="vertical">
                <div style="display: flex;justify-content: space-between;">
                    <a-date-picker v-model:value="selectedDate" @change="handleMonthChange"
                        :disabledDate="disabledDate" />
                    <a-button type="primary" :disabled="!showVip" @click="startDayWork">开始执行</a-button>
                </div>
                <!-- 预览 -->
                <div style="display: flex;justify-content: space-between;text-align: left;">
                    <a-card title="yaml配置" size="small" style="flex: 3;">
                        <codemirror ref="mycodemirror" v-model="yamlContent" :disabled="false" :indentWithTab="true"
                            :extensions="extensions" :placeholder="'请输入yaml配置'" :tabSize="2"
                            style="height: 100%;resize: none; text-align: left;" />
                    </a-card>
                    <a-card title="打印信息" size="small" style="flex: 2;">
                        <div class="log-area" v-html="styledInfoList" disabled="true"></div>
                    </a-card>
                </div>
            </a-space>
        </a-card>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive, onUnmounted } from 'vue';
import { Button, DatePicker, Table, Space, message, Card, Form } from 'ant-design-vue';
// const dayjs = require('dayjs');
import dayjs from 'dayjs';
import { Codemirror } from 'vue-codemirror'
import { EditorView } from '@codemirror/view'
import { yaml, yamlLanguage } from '@codemirror/lang-yaml'
import { autocompletion } from '@codemirror/autocomplete'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight' // 语法高亮标签

const { ipcRenderer } = require("electron");
import jsyaml from 'js-yaml';
import { dayWorkData } from '../../utils/dayWorkData.js'

import { askUserList } from '../../utils/request.js'

import { useRoute } from 'vue-router';

const route = useRoute();

const mobile = ref(route.query.mobile);
const password = ref(route.query.password);

// 先获取 token
const usertoken = localStorage.getItem("usertoken") || "";

const allTempleStr = ref(localStorage.getItem("allDayWorkTempleStr") || "[]");//存储所有模板数据
const allTemples = reactive([]);
try {
    const parsed = JSON.parse(allTempleStr.value);
    allTemples.splice(0, allTemples.length, ...parsed); // 保持响应性
} catch (e) {
    allTemples.splice(0, allTemples.length); // 清空数组
}

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
const styledInfoList = ref("");

var changeText = dayWorkData;
var result = reactive(jsyaml.load(changeText));
result.mobile = mobile.value;
result.password = password.value;

const yamlContent = ref(changeText);

let showVip = ref(false);
let vipLevel = ref([]);
let holiday = reactive({});
let workday = reactive({});

const ADatePicker = DatePicker;
const AButton = Button;
const ASpace = Space;
const ACard = Card;

const selectedDate = ref();
const getUserListShowAsk = async () => {
    try {
        var userInfo = await askUserList();
        showVip.value = false;
        if (userInfo.vipList && userInfo.vipList.length > 0) {
            userInfo.vipList.forEach(item => {
                if (item.mobile === mobile.value) {
                    showVip.value = true;
                    vipLevel.value = item.vipLevel ? item.vipLevel : [];
                }
            });
        }
        if (userInfo.holiday && Object.keys(userInfo.holiday).length > 0) {
            holiday.value = userInfo.holiday;
        }
        if (userInfo.workday && Object.keys(userInfo.workday).length > 0) {
            workday.value = userInfo.workday;
        }
    } catch (e) {
        console.error("获取用户列表失败:", e);
    }
};

getUserListShowAsk();
// 设置默认月份
onMounted(() => {
    selectedDate.value = dayjs();
});
// 在组件卸载时清理所有监听器
onUnmounted(() => {
    ipcRenderer.removeAllListeners('dayWork-progress');
});

const handleMonthChange = (date) => {
    // console.log("选择的日期:", date);
    selectedDate.value = date;
};
// 禁止选择今天之后的日期
const disabledDate = (current) => {
    // current 是一个 dayjs 对象
    // dayjs().endOf('day') 表示今天的最后一毫秒
    // 如果 current 大于今天，则禁用该日期
    // return current && current > dayjs().endOf('day');

    // 禁用今天及之后的日期
    // return current && current >= dayjs().startOf('day');

    // 禁用今天之后的日期和30天前之前的日期
    const today = dayjs();
    const thirtyDaysAgo = today.subtract(30, 'day');
    return current && (current > today.endOf('day') || current < thirtyDaysAgo.startOf('day'));

};
async function startDayWork() {

    if (!selectedDate.value) {
        message.warning('请先选择日期');
        return;
    }

    const yamlText = yamlContent.value;
    if (!yamlText) {
        console.error("YAML text is empty.");
        addLinfo("YAML text is empty.", 'error');
        return;
    }
    const resultNew = jsyaml.load(yamlText);
    result = { ...result, ...resultNew };

    // 先移除之前的监听器（如果存在）
    ipcRenderer.removeAllListeners('dayWork-progress');
    // 监听进度通知
    ipcRenderer.on('dayWork-progress', (_, progressMsg) => {
        // message.info(progressMsg.status); // 显示进度提示
        addLinfo(`${progressMsg.status}`);
    });

    try {
        styledInfoList.value = "";

        var formattedDate = selectedDate.value.format('YYYY-MM-DD');
        const xiangqis = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        const dayIndex = selectedDate.value.day();
        const xq = xiangqis[dayIndex];

        // 如果要获取具体假日信息：
        const holidayInfo = holiday[formattedDate];
        const workdayInfo = workday[formattedDate];

        var notNeedSedn = false;
        if (!result.notCheckDay) {
            if (holidayInfo || (xq == "星期日" && !workdayInfo)) {
                notNeedSedn = true;
                addLinfo(`今天 (${formattedDate}-${xq}) 不需要发送日报。`);
            } else {
                addLinfo(`今天 (${formattedDate}-${xq}), 需要工作。`);
            }
        }
        
        if(notNeedSedn){
            addLinfo(
                "跳过当前日期：",
                `今天 (${formattedDate}-${xq}) 经过假日或周日判断，不需要发送日报。已跳过`
            );
        } else {

            // 创建一个可序列化的对象，只包含必要的属性
            const dayconfig = {
                mobile: result.mobile,
                password: result.password,
                env: result.env,
                saveSubmit: result.saveSubmit ? result.saveSubmit : false,
                // 使用 JSON.parse(JSON.stringify()) 来深度克隆并去除响应式包装
                textareas: result.textareas ? JSON.parse(JSON.stringify(result.textareas)) : [],
                modelFormData: result.modelFormData ? JSON.parse(JSON.stringify(result.modelFormData)) : {}
            };
            console.log("准备调用 ipcRenderer.invoke", {
                url: `https://ssc${result.env}.homedo.com/login`,
                formattedDate: formattedDate,
                config: dayconfig
            });
            await ipcRenderer.invoke(
                'puppeteer-dayWork',
                `https://ssc${result.env}.homedo.com/login`,
                formattedDate,
                dayconfig
            );

            // console.log("ipcRenderer.invoke 调用完成", resultInvoke);
        }

        // message.success('数据获取成功');
    } catch (error) {
        console.error("详细错误:", error);

        // message.error('数据获取失败');
    }
}

const useTemple = (index) => {
    yamlContent.value = allTemples[index].content
}
const saveCurrentTemple = () => {
    allTemples.push({
        name: `模版${allTemples.length + 1}`,
        content: yamlContent.value
    });
    saveLocalStorage()
}
const deleteTemple = (index) => {
    allTemples.splice(index, 1);
    saveLocalStorage()
}

const saveLocalStorage = () => {
    const allTempleStrNew = JSON.stringify(allTemples);
    localStorage.setItem("allDayWorkTempleStr", allTempleStrNew);
}

const addLinfo = (info, type = 'info', addtime = false) => {
    const colors = {
        error: 'red',
        success: 'green',
        warning: 'orange',
        info: '#333'
    };
    const newLine = `<span style="color: ${colors[type]}">${info} ${addtime ? nowTimestr() : ""}</span>`;
    styledInfoList.value = styledInfoList.value
        ? `${styledInfoList.value}<br>${newLine}`
        : newLine;
}
const nowTimestr = () => {
    const now = new Date();
    return now.toLocaleString();
}

</script>

<style scoped>
.status-message {
    padding: 8px 16px;
    background-color: #f0f0f0;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.screenshot-preview {
    margin-top: 20px;
    padding: 10px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
}

.ant-space {
    width: 100%;
    padding: 20px;
}
</style>