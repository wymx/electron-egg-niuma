<template>
  <div class="upload-container">
    <div class="upload-form">
      <span style="color: red;font-size: 25px;">注意：相同路径相同名称的文件会被覆盖</span>
      <div class="form-item">
        <span style="width: 80px;">项目名称</span>
        <a-input v-model:value="projectPath" placeholder="homedo-wx-uni/" />
      </div>
      <div class="form-item">
        <span style="width: 80px;">图片路径</span>
        <a-input v-model:value="imagePath" placeholder="static/" />
      </div>
      <div class="form-item checkbox-item">
        <span>是否保持原文件名</span>
        <a-checkbox v-model:checked="keepOriginalName">保持原文件名</a-checkbox>
      </div>

      <div class="upload-area" @click="triggerFileInput">
        <div class="drop-box" @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop" :style="{ borderColor: dragActive ? 'red' : '#a89b9b' }">
          <p class="drop-text">
            拖拽图片到此上传/粘贴图片到此上传
            <span @click.stop="triggerFileInput">点击上传</span>
          </p>
          <div class="preview-container">
            <div v-for="(file, index) in files" :key="index" class="file-preview">
              <img v-if="isImage(file.type)" :src="getFilePreview(file)" class="file-thumbnail" />
              <img v-else :src="getFileIcon(file.type)" class="file-thumbnail" />
              <p class="file-name" :title="file.name">{{ file.name }}</p>
            </div>
          </div>
        </div>
        <input type="file" id="uploadfile" ref="fileInput" style="display: none" multiple @change="handleFileChange" />
      </div>

      <div class="upload-results">
  <div class="results-header">
    <h3>上传结果</h3>
    <span class="hint-text">(右键可以直接复制)</span>
  </div>
  <div class="result-list">
    <div v-for="(result, index) in uploadResults" :key="index" class="result-item">
      <div @contextmenu.prevent="copyUrl(result.url)">
        <a :href="result.url" target="_blank">{{ result.url }}</a>
      </div>
    </div>
  </div>
</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { message } from 'ant-design-vue';
import axios from 'axios';

// 表单数据
const projectPath = ref('homedo-oss/');
const imagePath = ref(`static/${new Date().getTime()}/`);
const keepOriginalName = ref(true);

// 文件处理
const files = ref([]);
const fileInput = ref(null);
const dragActive = ref(false);
const uploadResults = ref([]);

// 文件图标映射
const fileTypeIcons = {
  'application/msword': 'https://hmd-mall-product.homedo.com/homedo-oss/static/1705459806/word.png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'https://hmd-mall-product.homedo.com/homedo-oss/static/1705459806/word.png',
  'application/vnd.ms-powerpoint': 'https://hmd-mall-product.homedo.com/homedo-oss/static/1705459806/ppt.png',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'https://hmd-mall-product.homedo.com/homedo-oss/static/1705459806/ppt.png',
  'application/vnd.ms-excel': 'https://hmd-mall-product.homedo.com/homedo-oss/static/1705459806/excel.png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'https://hmd-mall-product.homedo.com/homedo-oss/static/1705459806/exe.png',
  'application/pdf': 'https://hmd-mall-product.homedo.com/homedo-oss/static/1705459806/pdf.png',
  'text/plain': 'https://hmd-mall-product.homedo.com/homedo-oss/static/1705459806/text.png',
  'text/javascript': './static/image/js.png',
  'text/html': './static/image/html.png',
  'text/css': './static/image/css.png'
};

// 判断是否是图片
const isImage = (fileType) => {
  return fileType && fileType.startsWith('image/');
};

// 获取文件预览
const getFilePreview = (file) => {
  return URL.createObjectURL(file);
};

// 获取文件图标
const getFileIcon = (fileType) => {
  return fileTypeIcons[fileType] || 'https://hmd-mall-product.homedo.com/homedo-oss/static/1705459806/other.png';
};

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value.click();
};

// 处理文件选择
const handleFileChange = (event) => {
  const selectedFiles = Array.from(event.target.files);
  files.value = [...files.value, ...selectedFiles];
  selectedFiles.forEach(file => uploadFile(file));
  event.target.value = ''; // 重置input，允许选择相同文件
};

// 拖拽相关处理
const handleDragOver = () => {
  dragActive.value = true;
};

const handleDragLeave = () => {
  dragActive.value = false;
};

const handleDrop = (event) => {
  dragActive.value = false;
  const droppedFiles = Array.from(event.dataTransfer.files);
  files.value = [...files.value, ...droppedFiles];
  droppedFiles.forEach(file => uploadFile(file));
};

// 粘贴处理
document.addEventListener('paste', (event) => {
  const clipboardData = event.clipboardData || event.originalEvent?.clipboardData;
  if (!clipboardData) return;

  const items = clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const blob = items[i].getAsFile();
      if (blob) {
        files.value = [...files.value, blob];
        uploadFile(blob);
      }
    }
  }
});

// 上传文件
const uploadFile = async (file) => {
  try {
    // 获取OSS配置
    const ossConf = await axios.post(
      'https://framework-cms-restws.homedo.com/framework-cms-integration/public/getOSSInfo'
    );

    const { OSSAccessKeyId, key, policy, signature, dir, host } = ossConf.data.data;

    let fileName;
    if (keepOriginalName.value) {
      fileName = projectPath.value + imagePath.value + String(file.name).replace(/&/g, "");
    } else {
      const timestamp = new Date().getTime();
      const fileType = file.name.split('.');
      fileName = projectPath.value + imagePath.value +
        String(timestamp).replace(/&/g, "") +
        '.' + fileType[fileType.length - 1];
    }

    const formData = new FormData();
    formData.append('name', fileName);
    formData.append('key', fileName);
    formData.append('policy', policy);
    formData.append('OSSAccessKeyId', OSSAccessKeyId);
    formData.append('success_action_status', '200');
    formData.append('signature', signature);
    formData.append('file', file);

    const fileUrl = host + '/' + fileName;

    // 上传文件
    const config = {
      timeout: 1000 * 60 * 10,
      headers: { 'Content-Type': 'multipart/form-data', platform: 'PC' },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`上传进度: ${percent}%`);
      }
    };

    const response = await axios.post(host, formData, config);

    if (response.status === 200) {
      uploadResults.value = [...uploadResults.value, { url: fileUrl }];
      message.success(`${file.name} 上传成功`);
    } else {
      throw new Error('上传失败');
    }
  } catch (error) {
    console.error('上传失败:', error);
    message.error(`${file.name} 上传失败: ${error.message}`);
  }
};

const copyUrl = (url) => {
  try {
    navigator.clipboard.writeText(url).then(() => {
      message.success('链接已复制到剪贴板');
    }).catch(err => {
      console.error('复制失败:', err);
      message.error('复制失败');
    });
  } catch (err) {
    // 兼容不支持 Clipboard API 的浏览器
    const textarea = document.createElement('textarea');
    textarea.value = url;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    message.success('链接已复制到剪贴板');
  }
};
</script>

<style scoped>
.upload-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.upload-form {
  display: flex;
  flex-direction: column;
}

.form-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.checkbox-item {
  margin-top: 12px;
  margin-bottom: 12px;
}

.upload-area {
  position: relative;
  width: 100%;
  height: 452px;
  background: #f7f6f6;
  margin-bottom: 16px;
}

.drop-box {
  width: 100%;
  height: 100%;
  border: 1px dashed #a89b9b;
  overflow-y: auto;
  cursor: pointer;
}

.drop-text {
  position: absolute;
  width: 100%;
  text-align: center;
  top: 200px;
  opacity: 0.3;
  z-index: 1;
}

.drop-text span {
  color: #347aa5;
  cursor: pointer;
}

.preview-container {
  display: flex;
  flex-wrap: wrap;
  padding: 8px;
  gap: 8px;
}

.file-preview {
  width: 100px;
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.file-thumbnail {
  width: 100%;
  height: 100px;
  object-fit: contain;
}

.file-name {
  width: 100%;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  padding: 8px;
  background: #f0f0f0;
  border-radius: 4px;
}

.result-item a {
  color: #1890ff;
  text-decoration: none;
}

.result-item a:hover {
  text-decoration: underline;
}

.upload-results {
  display: flex;
  gap: 16px; /* 控制标题和列表之间的间距 */
  align-items: flex-start; /* 顶部对齐 */
}

.results-header {
  display: flex;
  flex-direction: column;
  min-width: 120px; /* 控制标题区域宽度 */
}

.hint-text {
  color: #666;
  font-size: 12px;
  margin-top: 4px;
}

.result-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>