<template>
    <div>
        <div>
            <a-form layout="inline">
                <a-form-item label="账号">
                    <a-input v-model:value="account" placeholder="请输入账号" @change="handleAccountChange" />
                </a-form-item>
                <a-form-item label="密码">
                    <a-input-password v-model:value="password" placeholder="请输入密码"  @change="handlePasswordChange" />
                </a-form-item>
            </a-form>
            <div v-if="statusMessage" class="status-message">
                {{ statusMessage }}
            </div>
        </div>
        <a-card title="工时记录" size="small">
            <a-space direction="vertical">
                <div style="display: flex;justify-content: space-between;">
                    <a-date-picker :disabled="!showVip" picker="month" v-model:value="selectedMonth" @change="handleMonthChange"
                        placeholder="选择月份"  />
                    <a-button type="primary" :disabled="!showVip" @click="fetchTimeData">获取工时数据</a-button>
                    <a-button type="link" :disabled="!showVip" @click="exportToExcel">导出Excel</a-button>
                </div>
                <a-table :columns="columns" :dataSource="timeList" bordered size="small" rowKey="id" :pagination="{
                    pageSize:11
                }">
                </a-table>
                <!-- 截图预览 -->
                <div v-if="screenshotUrl" class="screenshot-preview">
                    <a-button type="link" @click="downloadScreenshot" v-if="screenshotUrl">
                        下载截图
                    </a-button>
                    <img :src="screenshotUrl" alt="考勤页面截图" style="max-width: 100%;" />
                </div>
            </a-space>
        </a-card>
        <a-card title="请假记录" size="small">
            <a-space direction="vertical">
                <div style="display: flex;justify-content: space-between;">
                    <a-button type="primary" :disabled="!showVip" @click="fetchTimeData2">获取请假数据</a-button>
                    <a-button type="link" :disabled="!showVip" @click="exportToExcel2">导出Excel</a-button>
                </div>
                <a-table :columns="columns2" :dataSource="timeList2" bordered size="small" rowKey="id">
                </a-table>
                <!-- 截图预览 -->
                <div v-if="screenshotUrl2" class="screenshot-preview">
                    <a-button type="link" @click="downloadScreenshot2" v-if="screenshotUrl2">
                        下载截图
                    </a-button>
                    <img :src="screenshotUrl2" alt="请假页面截图" style="max-width: 100%;" />
                </div>
            </a-space>
        </a-card>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
const dayjs = require('dayjs');
const XLSX = require("xlsx");
import { Button, DatePicker, Table, Space, message, Card, Form } from 'ant-design-vue';
const { ipcRenderer } = require("electron");
import { saveInfo2 } from "../../utils/sendNotify.js";
import { askUserList } from '../../utils/request.js'


const account = ref(''); // 默认值
const password = ref('');   // 默认值

const allResult = ref(localStorage.getItem("timeAccountInfo") || "{}");
const allData = JSON.parse(allResult.value);
account.value = allData.account || "";
password.value = allData.password || "";
// 新增状态信息
const statusMessage = ref('');
const screenshotUrl = ref(null);

let showVip = ref(false);
let vipLevel = ref([]);

const ADatePicker = DatePicker;
const AButton = Button;
const ATable = Table;
const ASpace = Space;
const ACard = Card;
const AForm = Form;

const columns = [
    { title: '日期', dataIndex: 'date', key: 'date' },
    { title: '上班时间', dataIndex: 'startTime', key: 'startTime' },
    { title: '下班时间', dataIndex: 'endTime', key: 'endTime' },
    { title: '工作时长', dataIndex: 'duration', key: 'duration' },
    { title: '考勤状态', dataIndex: 'status', key: 'status' },
];

const selectedMonth = ref(null);
const timeList = ref([]);


const validateAndSave = () => {
      if (account.value.length > 0 &&
        password.value.length > 0) {
        localStorage.setItem("timeAccountInfo", JSON.stringify({
            account: account.value,
            password: password.value
        }));
    }
    getUserListShowAsk();
};

const handleAccountChange = () => {
    validateAndSave();
};

const handlePasswordChange = () => {
    validateAndSave();
};
const getUserListShowAsk = async () => {
    try {
        var userInfo = await askUserList();
        showVip.value = false;
        if (userInfo.vipList && userInfo.vipList.length > 0) {
            userInfo.vipList.forEach(item => {
                if (item.mobile === account.value) {
                    showVip.value = true;
                    vipLevel.value = item.vipLevel ? item.vipLevel : [];
                }
            });
        }
    } catch (e) {
        console.error("获取用户列表失败:", e);
    }
};

getUserListShowAsk();
// 设置默认月份
onMounted(() => {
    selectedMonth.value = dayjs();
    statusMessage.value = '';
});

const handleMonthChange = (date) => {
    selectedMonth.value = date;
};
async function fetchTimeData() {
    if (!selectedMonth.value) {
        message.warning('请先选择月份');
        return;
    }
    if (!account.value) {
        message.warning('请输入账号');
        return;
    }
    if (!password.value) {
        message.warning('请输入密码');
        return;
    }

    try {

        statusMessage.value = '正在获取数据...';
        const month = selectedMonth.value.month() + 1;
        const year = selectedMonth.value.year();
        const endDate = new Date(year, month, 0).getDate();
        const dateRange = `${year}/${month}/01-${year}/${month}/${endDate}`;
        // 监听进度通知
        ipcRenderer.on('puppeteer-progress', (_, progressMsg) => {
            // message.info(progressMsg.status); // 显示进度提示
            statusMessage.value = progressMsg.status;
        });
        // 监听数据返回
        // 在接收数据的回调中
        ipcRenderer.on('puppeteer-data', (_, data) => {
            timeList.value = (data.biz_data || []).map(item => {
                return {
                    date: item.SwipingCardDate?.text || '',
                    name: item.StaffId?.text || '',
                    startTime: item.ActualForFirstCard?.text || '未打卡',
                    endTime: item.ActualForLastCard?.text || '未打卡',
                    duration: item.WorkPeriod?.text || '0',
                    status: item.AttendanceStatus?.text || '未知',
                    rawData: item // 保留原始数据
                }
            });
        });
        // 监听错误
        ipcRenderer.on('puppeteer-error', (_, error) => {
            message.error(`抓取失败: ${error}`);
        });
        // 监听截图数据
        ipcRenderer.on('puppeteer-screenshot', (_, screenshotData) => {
            screenshotUrl.value = `data:image/png;base64,${screenshotData}`;
        });
        await ipcRenderer.invoke(
            'puppeteer-scrape',
            'https://www.italent.cn/Login',
            dateRange,
            account.value,
            password.value
        );
        saveInfo2({
            account: account.value,
            password: password.value,
        })
        statusMessage.value = "";
        message.success('数据获取成功,查看截图');
    } catch (error) {
        console.error("详细错误:", error);
        message.error('数据获取失败');
    }
}

// 下载截图
function downloadScreenshot() {
    if (!screenshotUrl.value) return;
    const timestamp = dayjs().format('YYYYMMDDHHmmss');
    const link = document.createElement('a');
    link.href = screenshotUrl.value;
    const month = selectedMonth.value.month() + 1;
    const year = selectedMonth.value.year();
    const dateRange = `${year}年-${month}月`;
    link.download = `考勤截图_${dateRange}.png`;
    link.click();
}

async function exportToExcel() {
    if (timeList.value.length === 0) {
        message.warning('没有数据可导出');
        return;
    }

    try {
        // 数据转换
        const excelData = timeList.value.map(item => ({
            '日期': item.date,
            '姓名': item.name,
            '上班时间': item.startTime,
            '下班时间': item.endTime,
            '工作时长(小时)': item.duration,
            '考勤状态': item.status
        }));

        // 创建工作表
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // 设置列宽
        worksheet['!cols'] = [
            { wch: 15 }, { wch: 20 }, { wch: 15 },
            { wch: 15 }, { wch: 15 }, { wch: 15 }
        ];

        // 创建工作簿
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "考勤数据");

        const month = selectedMonth.value.month() + 1;
        const year = selectedMonth.value.year();
        const dateRange = `${year}年-${month}月`;
        // 弹出保存对话框
        const { filePath } = await ipcRenderer.invoke('show-save-dialog', {
            title: '保存Excel文件',
            defaultPath: `考勤数据_${dateRange}.xlsx`,
            filters: [
                { name: 'Excel文件', extensions: ['xlsx'] },
                { name: '所有文件', extensions: ['*'] }
            ]
        });

        if (filePath) {
            XLSX.writeFile(workbook, filePath);
            message.success(`文件已保存到: ${filePath}`);
        }
    } catch (error) {
        console.error("导出失败:", error);
        message.error(`导出失败: ${error.message}`);
    }
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

const screenshotUrl2 = ref(null);

const columns2 = [
    { title: '休假项目', dataIndex: 'date', key: 'date' },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime' },
    { title: '结束时间', dataIndex: 'endTime', key: 'endTime' },
    { title: '时长', dataIndex: 'duration', key: 'duration' },
    { title: '原因', dataIndex: 'reason', key: 'reason' },
    { title: '审核', dataIndex: 'status', key: 'status' },
];

const timeList2 = ref([]);
async function fetchTimeData2() {
    if (!account.value) {
        message.warning('请输入账号');
        return;
    }
    if (!password.value) {
        message.warning('请输入密码');
        return;
    }

    try {

        statusMessage.value = '正在获取数据...';
        const month = selectedMonth.value.month() + 1;
        const year = selectedMonth.value.year();
        const endDate = new Date(year, month, 0).getDate();
        const dateRange = `${year}/${month}/01-${year}/${month}/${endDate}`;
        // 监听进度通知
        ipcRenderer.on('puppeteer-progress', (_, progressMsg) => {
            // message.info(progressMsg.status); // 显示进度提示
            statusMessage.value = progressMsg.status;
        });
        // 监听数据返回
        // 在接收数据的回调中
        ipcRenderer.on('puppeteer-data2', (_, data) => {
            timeList2.value = (data.biz_data || []).map(item => {
                return {
                    date: item.OIdVacationType?.text || '',
                    startTime: item.VacationStartDateTime?.text || '未打卡',
                    endTime: item.VacationStopDateTime?.text || '未打卡',
                    duration: item.VacationDurationIncludeUnit?.text || '0',
                    reason: item.Reason?.text || '未知',
                    status: item.ApproveStatus?.text || '通过',
                    rawData: item // 保留原始数据
                }
            });
        });
        // 监听错误
        ipcRenderer.on('puppeteer-error', (_, error) => {
            message.error(`抓取失败: ${error}`);
        });
        // 监听截图数据
        ipcRenderer.on('puppeteer-screenshot2', (_, screenshotData) => {
            screenshotUrl2.value = `data:image/png;base64,${screenshotData}`;
        });
        await ipcRenderer.invoke(
            'puppeteer-scrape2',
            'https://www.italent.cn/Login',
            dateRange,
            account.value,
            password.value
        );
        saveInfo2({
            account: account.value,
            password: password.value,
        })
        statusMessage.value = "";
        message.success('数据获取成功,查看截图');
    } catch (error) {
        console.error("详细错误:", error);
        message.error('数据获取失败');
    }
}


// 下载截图
function downloadScreenshot2() {
    if (!screenshotUrl2.value) return;
    const timestamp = dayjs().format('YYYYMMDDHHmmss');
    const link = document.createElement('a');
    link.href = screenshotUrl2.value;
    link.download = `请假截图_${timestamp}.png`;
    link.click();
}

async function exportToExcel2() {
    if (timeList2.value.length === 0) {
        message.warning('没有数据可导出');
        return;
    }

    try {
        // 数据转换
        const excelData = timeList2.value.map(item => ({
            '休假项目': item.date,
            '开始时间': item.startTime,
            '结束时间': item.endTime,
            '时长': item.duration,
            '原因': item.reason,
            '审核': item.status,
        }));

        // 创建工作表
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // 设置列宽
        worksheet['!cols'] = [
            { wch: 15 }, { wch: 20 }, { wch: 15 },
            { wch: 15 }, { wch: 15 }, { wch: 15 }
        ];

        // 创建工作簿
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "请假数据");

        // 弹出保存对话框
        const { filePath } = await ipcRenderer.invoke('show-save-dialog', {
            title: '保存Excel文件',
            defaultPath: `请假数据_${dayjs().format('YYYY-MM-DD')}.xlsx`,
            filters: [
                { name: 'Excel文件', extensions: ['xlsx'] },
                { name: '所有文件', extensions: ['*'] }
            ]
        });

        if (filePath) {
            XLSX.writeFile(workbook, filePath);
            message.success(`文件已保存到: ${filePath}`);
        }
    } catch (error) {
        console.error("导出失败:", error);
        message.error(`导出失败: ${error.message}`);
    }
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