<template>
    <div style="display: flex;flex-direction: column;margin-top: 8px;">
            <a-form layout="inline">
                <a-form-item label="答题地址">
                    <a-input style="min-width: 500px;" v-model:value="askUrl" placeholder="请输入作答的地址" />
                </a-form-item>
            </a-form>
        <div style="height: 100%;overflow: auto;">
            <div class="text-info" style="text-align: left;">打印信息</div>
            <div class="log-area" v-html="styledInfoList" disabled="true"></div>

            <button @click="parseYaml" :disabled="isRuning">开始执行</button>
        </div>
    </div>

</template>
<script setup>
import { ref, reactive } from 'vue'
import { loginGxh, queryExamPaperInfo, submitExamInfo,queryMyExamListInfo } from '../../utils/askMonth.js';
import { Form } from 'ant-design-vue';
const AForm = Form;

import { useRouter, useRoute } from 'vue-router';

const route = useRoute();

const askUrl = ref('');
const styledInfoList = ref("");

const mobile = ref(route.query.mobile);
const password = ref(route.query.password);

// 先获取 token
var usertoken = '';
// console.log("result:", result);
const parseYaml = async () => {
    try {
        
        var examId = askUrl.value.match(/examId=(\d+)/);
        var classId = askUrl.value.match(/classId=(\d+)/);
        if (!examId || !classId) {
            addLinfo("请检查作答地址是否正确，未找到 examId 或 classId 参数", 'error');
            return;
        }
        examId = examId[1];
        classId = classId[1];
        addLinfo(`获取到 examId: ${examId}, classId: ${classId}, 检查当前考试状态`);

        const response = await loginGxh(mobile.value);

        if (!response) {
            addLinfo("登录失败", 'error');
            return;
        }
        usertoken = response;
        addLinfo("登录成功，开始获取考试信息...", 'success');

        const responseList = await queryMyExamListInfo(usertoken);

        if (!responseList) {
            addLinfo("获取状态列表失败", 'error');
            return;
        }
        addLinfo("获取状态列表成功，检查当前考试");
        const items = responseList.items;
        console.log("items:", items);
        
        const currentExam = items.find(item => item.examId == examId && item.classId == classId);
        if (!currentExam) {
            addLinfo("未找到当前考试，请检查 examId 和 classId 是否正确", 'error');
            return;
        }
        if (currentExam.examStatus == 1) {
            addLinfo(`当前考试状态为 ${currentExam.examStatus}，考试已完成`, 'success');
            return;
        }
         addLinfo(`当前考试状态为 ${currentExam.examStatus}，开始处理`, 'warning');

        // 获取考试信息
        const examPaperInfo = await queryExamPaperInfo(usertoken, examId, classId);
        if (!examPaperInfo) {
            addLinfo("获取考试信息失败", 'error');
            return;
        }
        addLinfo("获取考试信息成功", 'success');
        addLinfo("开始自动提交考试信息");
        var submitData = {
            classifyManageId: examPaperInfo.examClassifyList[0].classifyManageId,
            examId: examId,
            detailList: [],
            classId: classId,
        };

        var examSubject = examPaperInfo.examSubject;
        examSubject.forEach((item) => {
            // 找出所有 rightAns 等于 1 的选项
            const correctAnswers = item.questionList
                .filter(q => q.rightAns === 1)
                .map(q => q.id);
            // 如果存在正确答案
            if (correctAnswers.length > 0) {
                submitData.detailList.push({
                    answer: correctAnswers.join(','), // 用逗号分隔多个正确答案 ID
                    subjectId: item.id
                });
            }
        });
        console.log("提交数据:", submitData);

        addLinfo("组装提交数据成功，开始自动提交", 'info');
        const submitDataEnd = await submitExamInfo(usertoken, submitData);
        if (!submitDataEnd) {
            addLinfo("提交失败", 'error');
            return;
        }
        addLinfo("提交成功", 'success');
        addLinfo("查看结果：", 'info');
        addLinfo("https://ssc.homedo.com/tabPage/appStore?menuId1=224&menuId2=119&aipuSchool=2", 'success');


    } catch (e) {
        console.error(e);
        addLinfo("报错了：" + "\n" + e.message, 'error');
    }

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