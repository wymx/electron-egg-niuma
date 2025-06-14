<template>
    <div class="batch-compress-container">
        <!-- 上部控制区域 -->
        <div class="control-section">
            <!-- 批量上传区域 -->
            <div class="upload-section">
                <a-upload multiple accept="image/*" :beforeUpload="handleBeforeUpload" :showUploadList="false">
                    <a-button type="primary" style="width: 300px">
                        <upload-outlined /> 批量选择图片 (最多 {{ maxFiles }} 张)
                    </a-button>
                    <div v-if="fileList.length > 0" class="file-count">
                        已选择 {{ fileList.length }} 张图片，总大小 {{ totalSize }}MB
                    </div>
                </a-upload>

                <div style="display: flex;align-items: center;margin-top: 20px;justify-content: center;">
                    <div style="margin-right: 10px">输出格式</div>
                    <a-select v-model:value="outputFormat" style="width: 150px">
                        <a-select-option value="jpeg">JPEG</a-select-option>
                        <a-select-option value="png">PNG</a-select-option>
                        <a-select-option value="webp">WebP</a-select-option>
                    </a-select>
                </div>
                <a-button type="primary" @click="batchCompress" :disabled="fileList.length === 0" :loading="compressing"
                    style="margin-top: 20px; width: 300px">
                    {{ compressing ? `压缩中 (${processedCount}/${fileList.length})` : '开始压缩' }}
                </a-button>
            </div>

            <!-- 压缩参数设置 -->
            <div class="compress-settings">
                <a-card title="压缩设置" size="small">
                    <a-space direction="vertical" size="small" style="width: 100%">
                        <div>
                            <div style="margin-bottom: 8px">图片质量 ({{ quality }}%)</div>
                            <a-slider v-model:value="quality" :min="10" :max="100" :step="5" />
                        </div>
                        <!-- <div>
                            <div style="margin-bottom: 8px">PNG压缩级别 ({{ pngQuality }})</div>
                            <a-slider v-model:value="pngQuality" :min="0" :max="9" :step="1" />
                        </div> -->
                        <div>
                            <div style="margin-bottom: 8px">尺寸调整 ({{ resizePercentage }}%)</div>
                            <a-slider v-model:value="resizePercentage" :min="10" :max="100" :step="5" />
                        </div>
                        <!-- 在压缩设置卡片中添加 -->
                        <div>
                            <div style="display: flex; gap: 10px; align-items: center;justify-content: space-around;">
                                <a-input-number v-model:value="customWidth" :min="1" placeholder="宽度(px)"
                                    style="width: 100px" />
                                <a-input-number v-model:value="customHeight" :min="1" placeholder="高度(px)"
                                    style="width: 100px" />
                                <a-checkbox v-model:checked="useCustomSize">启用</a-checkbox>
                            </div>
                        </div>
                    </a-space>
                </a-card>
            </div>
        </div>

        <!-- 图片列表和状态 -->
        <div class="image-list-container">
            <div class="image-list">
                <a-table :dataSource="fileList" :columns="columns" :pagination="{ pageSize: 10 }" rowKey="uid"
                    :scroll="{ x: 900 }">
                    <template #bodyCell="{ column, record }">
                        <!-- 预览列 -->
                        <template v-if="column.key === 'preview'">
                            <a-image :width="80" :src="record.preview" :preview="{ src: record.preview }" />
                        </template>

                        <!-- 原始尺寸列 -->
                        <template v-if="column.key === 'dimensions'">
                            <span v-if="record.width && record.height">
                                {{ record.width }} × {{ record.height }} px
                            </span>
                            <span v-else>-</span>
                        </template>

                        <!-- 原始大小 -->
                        <template v-if="column.key === 'size'">
                            <span v-if="record.size > 0">
                                {{ (record.size / 1024).toFixed(2) }} KB
                            </span>
                            <span v-else>-</span>
                        </template>

                        <!-- 压缩后尺寸列 -->
                        <template v-if="column.key === 'compressedDimensions'">
                            <span v-if="record.compressedWidth && record.compressedHeight">
                                {{ record.compressedWidth }} × {{ record.compressedHeight }} px
                            </span>
                            <span v-else>-</span>
                        </template>

                        <!-- 压缩后大小 -->
                        <template v-if="column.key === 'compressedSize'">
                            <span v-if="record.compressedSize > 0">
                                {{ (record.compressedSize / 1024).toFixed(2) }} KB
                            </span>
                            <span v-else>-</span>
                        </template>

                        <!-- 压缩率列 -->
                        <template v-if="column.key === 'ratio'">
                            <span v-if="record.compressedSize && record.size">
                                {{ calculateRatio(record.size, record.compressedSize) }}%
                            </span>
                            <span v-else>-</span>
                        </template>

                        <!-- 状态列 -->
                        <template v-if="column.key === 'status'">
                            <a-progress v-if="record.status === 'processing'" :percent="record.progress || 0"
                                status="active" size="small" />
                            <a-tag v-else-if="record.status === 'done'" color="success">完成</a-tag>
                            <a-tag v-else-if="record.status === 'error'" color="error">失败</a-tag>
                            <a-tag v-else color="default">等待</a-tag>
                        </template>

                        <!-- 操作列 -->
                        <template v-if="column.key === 'action'">
                            <a-button size="small" type="link" @click="downloadImage(record)"
                                :disabled="record.status !== 'done'">
                                下载
                            </a-button>
                        </template>
                    </template>
                </a-table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { UploadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
const { ipcRenderer } = require('electron');

// 压缩参数
const outputFormat = ref('png');
const quality = ref(80);
const pngQuality = ref(6);
const resizePercentage = ref(100);
const compressing = ref(false);
const processedCount = ref(0);

const customWidth = ref(null);
const customHeight = ref(null);
const useCustomSize = ref(false);
            
// 文件列表
const maxFiles = 20;
const fileList = ref([]);

// 计算总大小
const totalSize = computed(() => {
    const total = fileList.value.reduce((sum, file) => sum + file.size, 0);
    return (total / (1024 * 1024)).toFixed(2);
});

// 表格列定义
const columns = [
    {
        title: '文件名',
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
        fixed: 'left',
    },
    {
        title: '预览',
        key: 'preview',
        width: 100
    },
    {
        title: '原始尺寸',
        key: 'dimensions',
        width: 130
    },
    {
        title: '原始大小',
        dataIndex: 'size',
        key: 'size',
        width: 110
    },
    {
        title: '压缩后尺寸',
        key: 'compressedDimensions',
        width: 130
    },
    {
        title: '压缩后大小',
        dataIndex: 'compressedSize',
        key: 'compressedSize',
        width: 110
    },
    {
        title: '压缩率',
        key: 'ratio',
        width: 100
    },
    {
        title: '状态',
        key: 'status',
        width: 70
    },
    {
        title: '操作',
        key: 'action',
        fixed: 'right',
        width: 80
    }
];

// 添加压缩率计算方法
const calculateRatio = (originalSize, compressedSize) => {
    return ((1 - compressedSize / originalSize) * 100).toFixed(2);
};

// 处理文件选择
const handleBeforeUpload = (file, files) => {
    if (!file.type.startsWith('image/')) {
        message.error(`${file.name} 不是图片文件`);
        return false;
    }

    // 检查是否超过最大数量
    if (fileList.value.length + files.length > maxFiles) {
        message.warning(`最多只能选择 ${maxFiles} 张图片`);
        return false;
    }

    // 读取文件信息
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            fileList.value.push({
                uid: file.uid,
                name: file.name,
                preview: e.target.result,
                width: img.width,
                height: img.height,
                size: file.size,
                file: file,
                status: 'waiting',
                progress: 0
            });
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);

    return false;
};

// 批量压缩图片
const batchCompress = async () => {
    if (fileList.value.length === 0) {
        message.warning('请先选择图片');
        return;
    }

    compressing.value = true;
    processedCount.value = 0;

    // 逐个压缩图片
    for (const fileItem of fileList.value) {
        try {
            fileItem.status = 'processing';

            // 修改 batchCompress 中的参数传递
            const options = {
                quality: quality.value,
                pngQuality: pngQuality.value,
                resizePercentage: useCustomSize.value ? null : resizePercentage.value,
                format: outputFormat.value,
                customWidth: useCustomSize.value ? customWidth.value : null,
                customHeight: useCustomSize.value ? customHeight.value : null
            };

            const result = await ipcRenderer.invoke('compress-image', {
                imageData: fileItem.preview,
                options: options
            });

            fileItem.compressedData = result.compressedData;
            fileItem.compressedSize = result.size; // 确保主进程返回的 size 字段
            fileItem.compressedWidth = result.width;
            fileItem.compressedHeight = result.height;
            fileItem.status = 'done';

            processedCount.value++;
        } catch (error) {
            console.error(`压缩 ${fileItem.name} 失败:`, error);
            fileItem.status = 'error';
            fileItem.error = error.message;
            processedCount.value++;
        }
    }

    compressing.value = false;
    message.success(`压缩完成，成功 ${fileList.value.filter(f => f.status === 'done').length} 张`);
};

// 下载单张图片
const downloadImage = async (fileItem) => {
    const ext = outputFormat.value === 'jpeg' ? 'jpg' : outputFormat.value;
    const fileName = fileItem.name.replace(/\.[^/.]+$/, '') + '_compressed.' + ext;

    try {
        const result = await ipcRenderer.invoke('save-image', {
            dataUrl: fileItem.compressedData,
            defaultPath: fileName
        });

        if (result.success) {
            message.success(`已保存到: ${result.filePath}`);
        } else {
            message.error('保存失败');
        }
    } catch (error) {
        message.error(`保存失败: ${error.message}`);
    }
};
</script>

<style scoped>
.batch-compress-container {
    padding: 16px;
    display: flex;
    flex-direction: column;
    height: 100vh;
}

.control-section {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
}

.upload-section {
    flex: 1;
    padding: 16px;
    background: #fafafa;
    border-radius: 4px;
    border: 1px dashed #d9d9d9;
    min-width: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
}

.compress-settings {
    flex: 1;
    min-width: 50%;
    /* max-height: 200px; */
}

.file-count {
    margin-top: 8px;
    color: #666;
    font-size: 14px;
}

.image-list-container {
    flex: 1;
    overflow: auto;
}

.image-list {
    min-width: 100%;
    width: fit-content;
}

/* 表格单元格内容不换行 */
:deep(.ant-table td) {
    white-space: nowrap;
}
</style>