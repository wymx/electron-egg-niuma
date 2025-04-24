<template>
    <div style="display: flex;flex-direction: column;">
        <div style="display: flex;">
            <div>牛马工具</div>
            <button @click="closeApp">退出</button>
        </div>
        <div style="display: flex;flex-direction: row;height: calc(100vh - 20px);">
            <textarea name="yaml" id="" v-model="yamlContent" style="height: 100%;width: 50%;resize: none;"
                spellcheck="false"></textarea>
            <div style="width: 50%;height: 100%;overflow: auto;">
                <div class="top">
                    <div>
                        <input type="text" placeholder="请输入手机号" v-model="result.mobile" />
                        <input type="password" placeholder="请输入密码" v-model="result.password" />
                    </div>
                    <div>
                        <input type="password" placeholder="ai的key，为空不使用AI" v-model="result.aiKey" />
                        <input type="text" placeholder="ai的模型" v-model="result.aiModel" />
                        <input type="text" placeholder="为空则使用https://api.openai.com" v-model="result.apiUrl" />
                    </div>
                </div>
                <div class="text-info" style="text-align: left;">清单打印信息</div>
                <div class="log-area" v-html="styledInfoList" disabled="true"></div>
                <button @click="parseYaml" :disabled="isRuning">开始执行</button>
                <button v-show="isRuning" @click="submitTimer(result, true)">停止执行</button>
            </div>
        </div>
    </div>

</template>
<script setup>
import { ref, reactive } from 'vue'
import yaml from 'js-yaml';
import { loginUser, submitInfo, currentUserInfo, useMessageAI, useMessageOllama } from '../../utils/request.js'
import { submitQingdan } from '../../utils/defualData.js'

const isStopped = ref(false);


const allResult = ref(localStorage.getItem("allResult") || "{}");

const allData = JSON.parse(allResult.value);

const aiKey = ref(allData.aiKey || "");
const aiModel = ref(allData.aiModel || "");
const apiUrl = ref(allData.apiUrl || "");
const mobile = ref(allData.mobile || "");
const password = ref(allData.password || "");


const infoList = ref("");
const styledInfoList = ref("");
const isRuning = ref(false);

var changeText = submitQingdan;
var result = reactive(yaml.load(changeText));
result.aiKey = aiKey.value;
result.aiModel = aiModel.value;
result.apiUrl = apiUrl.value;
result.mobile = mobile.value;
result.password = password.value;


const refTime = ref(allData.refTime || 1);
const area = ref(allData.area || "FY");
const level = ref(allData.level || "C");
const executeMode = ref(allData.executeMode || "");

result.refTime = refTime.value;
result.area = area.value;
result.level = level.value;
result.executeMode = executeMode.value;

changeText = changeText.replace('refTime: ', `refTime: ${result.refTime}`);
changeText = changeText.replace('area: ""', `area: "${result.area}"`);
changeText = changeText.replace('level: ""', `level: "${result.level}"`);
changeText = changeText.replace('executeMode: ""', `level: "${result.executeMode}"`);

const yamlContent = ref(changeText);
// console.log("result:", result);
const parseYaml = async () => {
    try {
        const yamlText = yamlContent.value;
        infoList.value = "";
        styledInfoList.value = "";
        isRuning.value = true;

        if (!yamlText) {
            console.error("YAML text is empty.");
            addLinfo("YAML text is empty.", 'error');
            isRuning.value = false;
            return;
        }
        const resultNew = yaml.load(yamlText);
        result = { ...result, ...resultNew };
        // console.log("Parsed JSON:", JSON.stringify(result));

        if (!checkInput(result)) {
            isRuning.value = false;
            return;
        }
        // console.log("Parsed JSON:", JSON.stringify(result));

        localStorage.setItem("allResult", JSON.stringify(result))

        addLinfo("开始登录");
        const response = await loginUser({
            mobile: result.mobile,
            password: result.password
        });
        if (response) {
            addLinfo("登录成功", 'success');
            addLinfo("开始获取登录信息");
            const response = await currentUserInfo();
            if (response) {
                addLinfo("获取登录信息成功", 'success');
                submitTimer(result);
            } else {
                addLinfo("获取登录信息失败", 'error');
                isRuning.value = false;
            }
        } else {
            addLinfo("登录失败", 'error');
            isRuning.value = false;
        }
    } catch (e) {
        console.error(e);
        addLinfo("报错了：" + "\n" + e.message, 'error');
        isRuning.value = false;
    }

};


const checkInput = (result) => {
    if (!result.mobile || result.mobile.length < 1) {
        addLinfo("没有手机号", 'error');
        return false;
    }
    if (!result.password || result.password.length < 1) {
        addLinfo("没有密码", 'error');
        return false;
    }

    if (!["userSequence", "itemCross"].includes(result.executeMode)) {
        addLinfo("无效的执行模式", 'error');
        return false;
    }

    if (result.toUser.length < 1 || result.toUser[0].length < 1) {
        addLinfo("没有接收人", 'error');
        return false;
    }
    if (result.area.length < 1) {
        addLinfo("没有提出人区域", 'error');
        return false;
    }
    if (result.submitBody.length < 1 || result.submitBody[0].length < 1) {
        addLinfo("没有提交内容", 'error');
        return false;
    }

    // 更新二维数组校验逻辑
    if (result.toUser.length !== result.submitBody.length ||
        !result.submitBody.every(arr => arr.length > 0)) {
        addLinfo("接收人和提交内容维度不匹配", 'error');
        return false;
    }

    return true;
};

const submitTimer = async (qdconfig, stopRequest = false) => {

    try {

        if (stopRequest) {
            addLinfo("已请求停止执行", 'warning');
            throw new Error("用户主动中止循环");
        }

        const interval = 1000 * 60 * qdconfig.refTime; // 分钟的间隔
        addLinfo(`定时器间隔：${qdconfig.refTime}分钟`);
        const submitAndLog = async (userIndex, itemIndex) => {
            // const bodyInfo = qdconfig.submitBody[currentIndex];
            // addLinfo("开始提交：" + bodyInfo);
            const bodyInfo = qdconfig.submitBody[userIndex][itemIndex];
            const targetUser = qdconfig.toUser[userIndex];
            addLinfo(`提交给【${targetUser}】的第 ${itemIndex + 1} 项任务`);

            var aiBackInfo = bodyInfo;
            if (qdconfig.aiKey.length) {
                addLinfo("使用AI进行处理");
                var resultInfo = await useMessageAI(bodyInfo, qdconfig);
                if (resultInfo && resultInfo.choices && resultInfo.choices.length > 0) {
                    aiBackInfo = resultInfo.choices[0].message.content;
                    addLinfo("AI返回信息：" + aiBackInfo);
                } else {
                    addLinfo("AI返回数据异常，使用默认值");
                }
            }
            var submitStr = await submitInfo(targetUser, aiBackInfo, qdconfig);
            addLinfo(submitStr, 'success');
            if (submitStr.indexOf("没有找到touser用户信息") != -1) {
                throw new Error("找不到接收人");
            } else if (submitStr.indexOf("没有找到用户信息") != -1) {
                throw new Error("没有找到用户信息");
            } else if (submitStr.indexOf("提交失败") != -1) {
                throw new Error("提交失败了，稍后尝试");
            }
        };

        const executeStrategies = {
            userSequence: async () => {
                for (let userIndex = 0; userIndex < qdconfig.toUser.length; userIndex++) {
                    const userTasks = qdconfig.submitBody[userIndex];
                    for (let itemIndex = 0; itemIndex < userTasks.length; itemIndex++) {
                        if (isRuning.value) {
                            await submitAndLog(userIndex, itemIndex);
                            await new Promise(resolve => setTimeout(resolve, interval));
                        } else {
                            return;
                        }
                    }
                }
            },
            itemCross: async () => {
                const maxItems = Math.max(...qdconfig.submitBody.map(arr => arr.length));
                for (let itemIndex = 0; itemIndex < maxItems; itemIndex++) {
                    for (let userIndex = 0; userIndex < qdconfig.toUser.length; userIndex++) {
                        if (itemIndex < qdconfig.submitBody[userIndex].length) {
                            if (isRuning.value) {
                                await submitAndLog(userIndex, itemIndex);
                                await new Promise(resolve => setTimeout(resolve, interval));
                            } else {
                                return;
                            }
                        }
                    }
                }
            }
        };

        if (qdconfig.executeMode === "userSequence") {
            await executeStrategies.userSequence();
        } else {
            await executeStrategies.itemCross();
        }
        addLinfo("所有提交已完成，请重新配置");
    } catch (e) {
        if (e.message.includes("中止循环")) {
            addLinfo(e.message, 'error');
        } else {
            throw e; // 其他异常继续抛出
        }
        addLinfo("" + "" + e.message, 'error');
    } finally {
        isRuning.value = false;
        isStopped.value = false;
    }

};



const addLinfo = (info, type = 'info') => {
    const colors = {
        error: 'red',
        success: 'green',
        warning: 'orange',
        info: '#333'
    };

    const newLine = `<span style="color: ${colors[type]}">${info} ${nowTimestr()}</span>`;

    styledInfoList.value = styledInfoList.value
        ? `${styledInfoList.value}<br>${newLine}`
        : newLine;
}

const nowTimestr = () => {
    const now = new Date();
    return now.toLocaleString();
}

const closeApp = () => {
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('app-quit');
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