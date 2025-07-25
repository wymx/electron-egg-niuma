<template>
    <div style="display: flex;flex-direction: column;">
        <div style="display: flex;align-items: center;width: 100%;">
            <div style="width: 130px;">
                <div class="text-info">需要回复处理：{{ askList.length }}</div>
                <div class="text-info">需要评分：{{ pjList.length }}</div>
            </div>
            <div style="margin-left: 20px;width: 80px;">
                <div class="text-info">已读：{{ readNumber }}</div>
                <div class="text-info">未读：{{ readNoNumber }}</div>
            </div>
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
        </div>
        <div style="display: flex;flex-direction: row;height: calc(100vh - 40px);margin-top: 8px;">
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
import { loginUser, needList, askPreview, pjPreview, setReadStatus, autoReplyApi, submitUrl, checkItemDetial } from '../../utils/request.js'
import { askData } from '../../utils/askData.js'

import { Codemirror } from 'vue-codemirror'
import { EditorView } from '@codemirror/view'
import { yaml, yamlLanguage } from '@codemirror/lang-yaml'
import { autocompletion } from '@codemirror/autocomplete'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight' // 语法高亮标签

import { useRouter, useRoute } from 'vue-router';

const route = useRoute();

const mobile = ref(route.query.mobile);
const password = ref(route.query.password);

// 先获取 token
const usertoken = localStorage.getItem("usertoken") || "";

const allTempleStr = ref(localStorage.getItem("allAskTempleStr") || "[]");//存储所有模板数据
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

const addLinfo = (info, type = 'info', addtime = true) => {
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


// 登录信息进行请求
var askList = reactive([]);
var pjList = reactive([]);
var allList = reactive([]);
var readNumber = ref(0);
var readNoNumber = ref(0);

// 通过token获取数量信息
const getNumberInfo = async () => {
    try {

        askList = reactive([]);
        pjList = reactive([]);
        allList = reactive([]);
        readNumber = ref(0);
        readNoNumber = ref(0);

        if (!usertoken) {
            return;
        }
        const numberData = await needList(usertoken);
        if (numberData.code == 600 || numberData.msg == "登录过期,请重新登录") {
            const response = await loginUser({
                mobile: result.mobile,
                password: result.password
            });
            console.log("登录信息:", response);
            localStorage.setItem("usertoken", response)
            usertoken = response;
            // 重新获取数量信息
            getNumberInfo();
        }
        // console.log("获取数量信息333:", numberData);
        var list = numberData.list;
        list.forEach(async (item) => {
            if (item.type == '任务待解决-五项清单') {
                item.logInfo = "回复";
                item.isAsk = true;
                askList.push(item);
                await setReadStatus(item.iveId, usertoken);
            } else if (item.type == '任务待评分') {
                item.logInfo = "评分";
                item.isAsk = false;
                pjList.push(item);
            }
            if (item.readStatus == 2) {
                readNumber.value++;
            } else if (item.readStatus == 1) {
                readNoNumber.value++;
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

        if (!usertoken) {
            addLinfo("没有token", 'error');
            isRuning.value = false;
            return;
        }
        if (allList.length < 1) {
            addLinfo("没有需要处理/回复的清单");
            isRuning.value = false;
            return;
        }
        styledInfoList.value = "";
        const interval = 1000 * 60 * askconfig.refTime; // 分钟的间隔
        addLinfo(`定时器间隔：${askconfig.refTime}分钟`);
        for (const [index, item] of allList.entries()) {
            if (askconfig.dealNum > 0 && index >= askconfig.dealNum) {
                addLinfo("到达指定数量，停止执行");
                isRuning.value = false;
                break;
            } else {
                isRuning.value = true;
                const invId = item.iveId;
                addLinfo(`${item.logInfo}-第${index + 1}个:${item.raiseUserName}的清单-${invId}\n${item.body.trim().slice(0, 20)}...`, 'info', false);
                try {
                    if (item.isAsk) {
                        const randomIndex = Math.floor(Math.random() * askconfig.answer.length);
                        const selectedAnswer = askconfig.answer[randomIndex];

                        if (askconfig.answerUsers.includes(item.raiseUserName)) {
                            var infoStr = "不自动回复" + item.raiseUserName + "提的清单，跳过当前清单，请手动处理";
                            addLinfo(infoStr, 'error', false);
                        } else {
                            addLinfo("随机回复内容:" + selectedAnswer, 'info', false);
                            if (!askconfig.submitTest) {
                                const response = await askPreview(item, selectedAnswer, usertoken);
                                addLinfo("处理结果:" + JSON.stringify(response));
                            }

                            var info = askconfig.autoReply ? "自动回提已打开,开始回提..." : "不需要自动回提,处理下一条";
                            var type = askconfig.autoReply ? "success" : "warning";
                            addLinfo(info, type, false);

                            if (askconfig.autoReply && !askconfig.autoReplyUsers.includes(item.raiseUserName)) {
                                addLinfo("获取当前清单详情", 'info', false);
                                var responseDetial = await checkItemDetial(item.iveId, usertoken)
                                if (!responseDetial) {
                                    addLinfo("获取清单详情失败，将取消当前自动回提", 'error');
                                }
                                addLinfo("生成自动回提信息中...", 'info', false);
                                const responseAiData = await autoReplyApi(item.body);
                                if (!responseAiData || responseAiData.length < 1) {
                                    addLinfo("生成自动回提内容失败，将取消当前自动回提", 'error');
                                }
                                if (responseDetial && responseAiData) {
                                    addLinfo("自动回提内容:" + JSON.stringify(responseAiData), "success", false);
                                    responseDetial.body = responseAiData;
                                    if (!askconfig.submitTest) {
                                        autoSubmit(responseDetial)
                                    }
                                }

                            }
                        }
                    } else {
                        if (!askconfig.submitTest) {
                            const response = await pjPreview(item, usertoken);
                            console.log("评分结果:", response);
                        }
                    }
                } catch (error) {
                    addLinfo(`处理失败: ${error.message}`, 'error');
                }
                // if (index != allList.length - 1 && index + 1 < askconfig.dealNum) {
                //     await new Promise(resolve => setTimeout(resolve, interval)); // 等待间隔
                // }
                await new Promise(resolve => setTimeout(resolve, interval)); // 等待间隔

            }
        }
    } catch (error) {
        addLinfo(`操作失败: ${error.message}`, 'error')
    } finally {
        isRuning.value = false;
        getNumberInfo();

    }

};

const autoSubmit = async (responseDetial) => {

    // 类型4转3，提出人是对下属回提为对领导，其余暂时不变
    var type = responseDetial.type == "4" ? "3" : responseDetial.type;
    
    var submit1 = {
        id: "",
        flowId: "",
        readStatus: "1",
        isxs: "1",
        nos: "",
        task_from: "0",
        // raise_user_id: responseDetial.raise_user_id,
        // raise_user_name: responseDetial.raise_user_name,
        // raise_user_centre: responseDetial.raise_user_centre,
        raise_user_id: responseDetial.owner_user_id,
        raise_user_name: responseDetial.owner_user_name,
        raise_user_centre: responseDetial.owner_user_centre,
        type: type,
        area: result.area,
        crmArea: "",
        level: "C",
        body: responseDetial.body,
        attach_url: [],
        owner_user_id: responseDetial.raise_user_id,
        owner_user_name: responseDetial.raise_user_name,
        owner_user_centre: responseDetial.raise_user_centre,
        execute_user_id: [responseDetial.raise_user_id],
        execute_user_name: responseDetial.raise_user_name,
        finish_time: 0,
        beforeJudge: 2,
        create_time: "",
        meeting_resolution_time: null,
        status: 3,
        jnpf_meeting_task_jnpf_is_satisfaction: "-1"
    }
    var submitData = {
        ...submit1,
    }

    submitData.finish_time = await endTime();

    const timestamp2 = new Date().getTime();
    var nos = responseDetial.raise_user_id + "" + timestamp2;
    submitData.nos = nos;

    var dataStr = JSON.stringify(submitData);
    var submitDataEnd = { id: "", data: dataStr };

    // 处理提交的类型
    if (responseDetial.owner_user_centre == responseDetial.raise_user_centre) {
        submitData.status = "3";
        submitData.beforeJudge = "2";
        if (responseDetial.owner_user_id == responseDetial.raise_user_id) {
            submitData.type = "2";
        }
    } else {
        submitData.type = "1";
        submitData.status = "11";
        submitData.beforeJudge = "1";
    }


    console.log("提交数据:", submitData, usertoken, nos, submitData.type);

    await submitUrl(submitDataEnd, usertoken, nos, submitData.type);


};

const endTime = async () => {
    // 结束时间戳
    const date = new Date();
    // 获取当前日期
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth();
    // 计算下个月的第一天
    const nextMonthFirstDay = new Date(currentYear, currentMonth + 1, 1);
    // 设置为下个月第一天的前一天（即本月最后一天）
    date.setTime(nextMonthFirstDay.getTime() - 1);
    // 生成22-23点之间的随机小时
    const randomHour = 20 + Math.floor(Math.random() * 4); // 在 20:00 到 23:59 之间随机变化
    // 生成随机分钟(0-59)
    const randomMinutes = Math.floor(Math.random() * 60);
    // 生成随机秒数(0-59)
    const randomSeconds = Math.floor(Math.random() * 60);
    // 设置随机时间
    date.setHours(randomHour, randomMinutes, randomSeconds, 0);
    return date.getTime();
};
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
    localStorage.setItem("allAskTempleStr", allTempleStrNew);
}


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