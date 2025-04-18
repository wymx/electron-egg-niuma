<template>
    <div style="display: flex;flex-direction: row;height: 100vh;">
        <textarea name="yaml" id="" v-model="yamlContent" style="height: 100%;width: 50%;"></textarea>
        <div style="width: 50%;height: 100%;overflow: auto;">
            <div style="text-align: left;">打印信息</div>
            <textarea v-model="infoList" disabled="false" style="height: 200px;width: 1000%;"></textarea>
            <button @click="parseYaml">开始执行</button>
        </div>
    </div>

</template>
<script setup>
import { ref } from 'vue'
import yaml from 'js-yaml';
import Cookies from 'js-cookie'

import { loginUser, submitInfo, currentUserInfo } from '../../utils/request.js'
import { submitDefual } from '../../utils/defualData.js'
const infoList = ref("");

var changeText = submitDefual;
const result = yaml.load(changeText);
result.mobile = Cookies.get("mobile")||"";
result.password = Cookies.get("password")||"";
changeText = changeText.replace('mobile: ""', `mobile: "${result.mobile}"`);
changeText = changeText.replace('password: ""', `password: "${result.password}"`);
// console.log("result:", result);
// console.log("submitDefual:", changeText);
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

        const result = yaml.load(yamlText);
        // console.log("Parsed JSON:", JSON.stringify(result));
        if (!checkInput(result)) {
            return;
        }
        // console.log("Parsed JSON:", JSON.stringify(result));

        // Cookies.set("mobile", result.mobile);
        // Cookies.set("password", result.password);


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
    if (result.mobile.length < 1) {
        addLinfo("没有手机号");
        return false;
    }
    if (result.password.length < 1) {
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
    
    if (result.raise_user_centre.length < 1) {
        addLinfo("任务提出人所在中心不能为空");
        return false;
    }
    return true;
};

const submitTimer = async (qdconfig) => {
    // 初始化索引
    let currentIndex = 0;
    const interval = 1000 * 60 * qdconfig.refTime; // 分钟的间隔
    addLinfo(`定时器间隔：${qdconfig.refTime}分钟`);
    // 立即执行第一条数据
    if (currentIndex < qdconfig.submitBody.length) {
        const bodyInfo = qdconfig.submitBody[currentIndex];
        addLinfo("开始提交：" + bodyInfo);
        await submitInfo(bodyInfo, qdconfig);
        currentIndex++;
    }
    // 定时器函数
    const submitInterval = setInterval(async () => {
        if (currentIndex < qdconfig.submitBody.length) {
            const bodyInfo = qdconfig.submitBody[currentIndex];
            addLinfo("开始提交：" + bodyInfo);
            await submitInfo(bodyInfo, qdconfig);
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