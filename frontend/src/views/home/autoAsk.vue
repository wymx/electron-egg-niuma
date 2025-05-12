<template>
    <div style="display: flex;flex-direction: column;">
        <div style="display: flex;align-items: center;">
            <div>
                <div class="text-info">需要回复处理：{{ askList.length }}</div>
                <div class="text-info">需要评分：{{ pjList.length }}</div>
            </div>
            <div @click="gotoHome" style="margin-left: 20px;">首页</div>
            <!-- <router-link :to="{ name: menuInfo.pageName, params: menuInfo.params }">
                <span>跳转更新</span>
            </router-link> -->
        </div>
        <div style="display: flex;flex-direction: row;height: calc(100vh - 40px);">
            <codemirror ref="mycodemirror" v-model="yamlContent" :disabled="false" :indentWithTab="true"
                :extensions="extensions" :placeholder="'请输入yaml配置'" :tabSize="2"
                style="height: 100%;width: 50%;resize: none; text-align: left;" />
            <div style="width: 50%;height: 100%;overflow: auto;">
                <div class="text-info" style="text-align: left;">批量处理打印信息</div>
                <div class="log-area" v-html="styledInfoList" disabled="true"></div>
                <button @click="parseYaml" :disabled="isRuning">开始执行</button>
                <!-- <button v-show="isRuning" @click="submitTimer(result, true)">停止执行</button> -->
            </div>
        </div>
    </div>

</template>
<script setup>
import { ref, reactive } from 'vue'
import jsyaml from 'js-yaml';
import { loginUser, needList, askPreview, pjPreview } from '../../utils/request.js'
import { askData } from '../../utils/askData.js'

import { Codemirror } from 'vue-codemirror'
import { EditorView } from '@codemirror/view'
import { yaml, yamlLanguage } from '@codemirror/lang-yaml'
import { autocompletion } from '@codemirror/autocomplete'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight' // 语法高亮标签

import { useRouter, useRoute } from 'vue-router';

const route = useRoute();
const router = useRouter();
const gotoHome = () => {
    router.push({ name: 'Home' });
}
const mobile = ref(route.query.mobile);
const password = ref(route.query.password);

const menuInfo = {
    pageName: "FrameworkUpdaterIndex",
    params: {}
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
const isRuning = ref(false);

var changeText = askData;
var result = reactive(jsyaml.load(changeText));
result.mobile = mobile.value;
result.password = password.value;

const yamlContent = ref(changeText);
// console.log("result:", result);
const parseYaml = async () => {
    try {
        const yamlText = yamlContent.value;
        if (!yamlText) {
            console.error("YAML text is empty.");
            addLinfo("YAML text is empty.", 'error');
            return;
        }
        const resultNew = jsyaml.load(yamlText);
        result = { ...result, ...resultNew };
        // console.log("Parsed JSON:", JSON.stringify(result));

        if (!checkInput(result)) {
            isRuning.value = false;
            return;
        }
        checkList(result);
    } catch (e) {
        console.error(e);
        addLinfo("报错了：" + "\n" + e.message, 'error');
        isRuning.value = false;
    }

};


const checkInput = (result) => {
    if (!result.answer || result.answer.length < 1) {
        addLinfo("没有回复内容", 'error');
        return false;
    }
    // 修改后（数字类型校验）
    const num = Number(result.dealNum)
    if (isNaN(num) || !Number.isInteger(num) || num < 0) {
        addLinfo("处理条数配置不正确", 'error')
        return false
    }
    return true;
};

const addLinfo = (info, type = 'info',addtime = true) => {
    const colors = {
        error: 'red',
        success: 'green',
        warning: 'orange',
        info: '#333'
    };
    const newLine = `<span style="color: ${colors[type]}">${info} ${addtime?nowTimestr():""}</span>`;
    styledInfoList.value = styledInfoList.value
        ? `${styledInfoList.value}<br>${newLine}`
        : newLine;
}

const nowTimestr = () => {
    const now = new Date();
    return now.toLocaleString();
}


// 登录信息进行请求
var askList = reactive([]);
var pjList = reactive([]);
var allList = reactive([]);
// 通过token获取数量信息
const getNumberInfo = async () => {
    try {
        const tocken = localStorage.getItem("usertoken") || "";
        if (!tocken) {
            return;
        }
        const numberData = await needList(tocken);
        if (numberData.code == 600 || numberData.msg == "登录过期,请重新登录") {
            const response = await loginUser({
                mobile: result.mobile,
                password: result.password
            });
            console.log("登录信息:", response);
            localStorage.setItem("usertoken", response)
            // 重新获取数量信息
            getNumberInfo();
        }
        console.log("获取数量信息333:", numberData);
        var list = numberData.list;

        list.forEach((item) => {
            if (item.type == '任务待解决-五项清单') {
                item.logInfo = "回复";
                item.isAsk = true;
                askList.push(item);
            } else if (item.type == '任务待评分') {
                item.logInfo = "评分";
                item.isAsk = false;
                pjList.push(item);
            }
            allList.push(item);
        });
    } catch (e) {
        console.error("获取数量信息失败:", e);
    }
};
getNumberInfo();

// 处理数据
const checkList = async (askconfig) => {
    try {
        const tocken = localStorage.getItem("usertoken") || "";
        if (!tocken) {
            addLinfo("没有token", 'error');
            return;
        }
        const interval = 1000 * 60 * askconfig.refTime; // 分钟的间隔
        addLinfo(`定时器间隔：${askconfig.refTime}分钟`);

        for (const [index, item] of allList.entries()) {
            if (askconfig.dealNum > 0 && index >= askconfig.dealNum) {
                addLinfo("到达指定数量，停止执行");
                break;
            } else {
                const invId = item.iveId;
                addLinfo(`${item.logInfo}-第${index + 1}个:${invId}\n${item.body.trim().slice(0, 10)}...`, 'info',false);
                try {
                    if (item.isAsk) {
                        const randomIndex = Math.floor(Math.random() * askconfig.answer.length);
                        const selectedAnswer = askconfig.answer[randomIndex];
                        addLinfo("随机回复内容:" + selectedAnswer);
                        if (!askconfig.submitTest) {
                            const response = await askPreview(invId, selectedAnswer, tocken);
                            addLinfo("处理结果:" + JSON.stringify(response));
                        }
                    } else {
                        if (!askconfig.submitTest) {
                            const response = await pjPreview(invId, tocken);
                            console.log("评分结果:", response);
                        }
                    }
                } catch (error) {
                    addLinfo(`处理失败: ${error.message}`, 'error');
                }
                await new Promise(resolve => setTimeout(resolve, interval)); // 等待间隔
            }
        }
    } catch (error) {
        addLinfo(`操作失败: ${error.message}`, 'error')
    }
};



</script>
<style scoped>
.text-info {
    font-size: 15px;
}

.log-area {
    min-height: 400px;
    border: 1px solid #ccc;
    padding: 8px;
    white-space: pre-wrap;
    overflow: auto;
    font-family: monospace;
    text-align: left;
}
</style>