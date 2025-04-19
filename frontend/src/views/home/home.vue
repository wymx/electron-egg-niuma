<template>
    <div style="display: flex;flex-direction: column;">
        <div style="display: flex;flex-direction: row;height: 100vh;">
            <textarea name="yaml" id="" v-model="yamlContent" style="height: 100%;width: 50%;resize: none;"></textarea>
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
                <div style="text-align: left;">清单打印信息</div>
                <textarea v-model="infoList" disabled="false" style="height: 200px;width: 100%;"></textarea>
                <button @click="parseYaml">开始执行</button>
            </div>
        </div>
        <div v-show="false" style="display: flex;flex-direction: row;height: 100vh;">
            <textarea name="yaml" id="" v-model="yamlContent" style="height: 100%;width: 50%;resize: none;"></textarea>
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
                <div style="text-align: left;">日报打印信息</div>
                <textarea v-model="infoList" disabled="false" style="height: 200px;width: 100%;"></textarea>
                <button @click="parseYaml">开始执行</button>
            </div>
        </div>
    </div>

</template>
<script setup>
import { ref, reactive } from 'vue'
import yaml from 'js-yaml';
import Cookies from 'js-cookie'

import { loginUser, submitInfo, currentUserInfo, useMessageAI, useMessageOllama } from '../../utils/request.js'
import { submitQingdan } from '../../utils/defualData.js'

const allResult = ref(Cookies.get("allResult") || "{}");

const allData = JSON.parse(allResult.value);

const aiKey = ref(allData.aiKey || "");
const aiModel = ref(allData.aiModel || "");
const apiUrl = ref(allData.apiUrl || "");
const mobile = ref(allData.mobile || "");
const password = ref(allData.password || "");

const infoList = ref("");

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

result.refTime = refTime.value;
result.area = area.value;
result.level = level.value;

changeText = changeText.replace('refTime: ', `refTime: ${result.refTime}`);
changeText = changeText.replace('area: ""', `area: "${result.area}"`);
changeText = changeText.replace('level: ""', `level: "${result.level}"`);



const yamlContent = ref(changeText);
// console.log("result:", result);
const parseYaml = async () => {
    try {
        const yamlText = yamlContent.value;
        infoList.value = "";
        if (!yamlText) {
            console.error("YAML text is empty.");
            infoList.value = "YAML text is empty.";
            return;
        }
        const resultNew = yaml.load(yamlText);
        result = { ...result, ...resultNew };
        // console.log("Parsed JSON:", JSON.stringify(result));

        if (!checkInput(result)) {
            return;
        }
        // console.log("Parsed JSON:", JSON.stringify(result));

        Cookies.set("allResult", JSON.stringify(result), { expires: 7 });

        addLinfo("开始登录");
        const response = await loginUser({
            mobile: result.mobile,
            password: result.password
        });
        if (response) {
            addLinfo("登录成功");
            addLinfo("开始获取登录信息");
            const response = await currentUserInfo();
            if (response) {
                addLinfo("获取登录信息成功");
                submitTimer(result);
            } else {
                addLinfo("获取登录信息失败");
            }
        } else {
            addLinfo("登录失败");
        }
    } catch (e) {
        console.error(e);
        infoList.value = "报错了：" + "\n" + e.message;
    }

};


const checkInput = (result) => {
    if (!result.mobile || result.mobile.length < 1) {
        addLinfo("没有手机号");
        return false;
    }
    if (!result.password || result.password.length < 1) {
        addLinfo("没有密码");
        return false;
    }
    if (result.toUser.length < 1) {
        addLinfo("没有接收人");
        return false;
    }
    if (result.area.length < 1) {
        addLinfo("没有提出人区域");
        return false;
    }
    if (result.submitBody.length < 1) {
        addLinfo("没有提交内容");
        return false;
    }

    return true;
};

const submitTimer = async (qdconfig) => {
    // 初始化索引
    let currentIndex = 0;
    const interval = 1000 * 60 * qdconfig.refTime; // 分钟的间隔
    addLinfo(`定时器间隔：${qdconfig.refTime}分钟`);
    const submitAndLog = async (currentIndex) => {
        const bodyInfo = qdconfig.submitBody[currentIndex];
        addLinfo("开始提交：" + bodyInfo);
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

            // var resultInfo222 = await useMessageOllama(bodyInfo, qdconfig);
            // console.log("resultInfo222", resultInfo222);
        }


        await submitInfo(aiBackInfo, qdconfig);
    };


    // 如果只有一条数据，直接执行一次并清除定时器
    if (qdconfig.submitBody.length === 1) {
        await submitAndLog(currentIndex);
        addLinfo("所有提交已完成，请重新配置");
        return; // 直接返回，不进入定时器
    }

    // 立即执行第一条数据
    if (currentIndex < qdconfig.submitBody.length) {
        await submitAndLog(currentIndex);
        currentIndex++;
    }
    // 定时器函数
    const submitInterval = setInterval(async () => {
        if (currentIndex < qdconfig.submitBody.length) {
            await submitAndLog(currentIndex);
            currentIndex++;
            if (currentIndex >= qdconfig.submitBody.length) {
                // 清除定时器，停止进一步的执行
                clearTimer(submitInterval)
            }
        } else {
            // 清除定时器，停止进一步的执行
            clearTimer(submitInterval)
        }
    }, interval);
    const clearTimer = (submitInterval) => {
        currentIndex = 0;
        clearInterval(submitInterval);
        addLinfo("所有提交已完成，请重新配置");

    };

};

const addLinfo = (info) => {
    if (infoList.value.length > 0) {
        infoList.value = infoList.value + "\n" + info + " " + nowTimestr();
    } else {
        infoList.value = info + " " + nowTimestr();
    }
}

const nowTimestr = () => {
    const now = new Date();
    return now.toLocaleString();
}



</script>
<style scoped></style>