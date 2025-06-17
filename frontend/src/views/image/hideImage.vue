<template>
  <a-card title="图片隐写工具" :bordered="false" class="steganography-card">
    <!-- 文本输入区 -->
    <a-textarea
      v-model:value="hiddenText"
      placeholder="请输入要隐藏的文本"
      :auto-size="{ minRows: 2, maxRows: 4 }"
      allow-clear
    />

    <!-- 图片上传区 -->
    <a-upload
      v-model:file-list="fileList"
      list-type="picture-card"
      :show-upload-list="false"
      :before-upload="() => false"
      @change="handleImageUpload"
      class="upload-area"
    >
      <div v-if="!thumbnailSrc">
        <plus-outlined />
        <div style="margin-top: 8px">上传图片</div>
      </div>
      <img v-else :src="thumbnailSrc" alt="thumbnail" style="width: 100%" />
    </a-upload>

    <!-- 文件信息展示 -->
    <a-descriptions v-if="fileInfo" bordered size="small" :column="1" class="file-info">
      <a-descriptions-item label="文件名">{{ fileInfo.name }}</a-descriptions-item>
      <a-descriptions-item label="文件大小">{{ (fileInfo.size / 1024).toFixed(2) }} KB</a-descriptions-item>
      <a-descriptions-item label="文件类型">{{ fileInfo.type }}</a-descriptions-item>
    </a-descriptions>

    <!-- 操作按钮 -->
    <a-space class="action-buttons">
      <a-button 
        type="primary" 
        @click="hideText" 
        :disabled="!thumbnailSrc"
        :loading="hideLoading"
      >
        <template #icon><download-outlined /></template>
        隐藏并下载
      </a-button>
      <a-button 
        type="dashed" 
        @click="extractText" 
        :disabled="!thumbnailSrc"
        :loading="extractLoading"
      >
        <template #icon><file-search-outlined /></template>
        提取文本
      </a-button>
    </a-space>

    <!-- 提取结果展示 -->
    <a-card v-if="extractedText" title="提取结果" class="result-card">
      <a-alert :message="extractedText" type="info" show-icon />
    </a-card>
  </a-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { message } from 'ant-design-vue';

const TERMINATOR = '|STEG_END|'; // 使用更独特的终止符

// 响应式数据
const hiddenText = ref('');
const fileList = ref([]);
const fileInfo = ref(null);
const thumbnailSrc = ref('');
const extractedText = ref('');
const hideLoading = ref(false);
const extractLoading = ref(false);

// 计算终止符的二进制表示
const terminatorBinary = computed(() => {
  return [...TERMINATOR].map(c => 
    c.charCodeAt(0).toString(2).padStart(8, '0')
  ).join('');
});

// 处理方法
const handleImageUpload = ({ file }) => {
  fileInfo.value = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    thumbnailSrc.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

const hideText = async () => {
  if (!thumbnailSrc.value) {
    message.warning('请先上传图片');
    return;
  }

  hideLoading.value = true;
  try {
    const textToHide = hiddenText.value || '禁止泄露';
    await hideTextInImage(thumbnailSrc.value, textToHide);
    message.success('隐写完成，图片已下载');
  } catch (e) {
    message.error('隐写失败: ' + e.message);
    console.error(e);
  } finally {
    hideLoading.value = false;
  }
};

const hideTextInImage = (imageUrl, textToHide) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const textBinary = textToBinary(textToHide + TERMINATOR);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // 改进的LSB隐写算法
      for (let i = 0, textIndex = 0; i < pixels.length; i += 4) {
        if (textIndex < textBinary.length) {
          // 确保只修改最低有效位
          pixels[i] = (pixels[i] & 0xFE) | parseInt(textBinary[textIndex]);
          textIndex++;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      downloadImage(canvas);
      resolve();
    };

    img.onerror = () => {
      throw new Error('图片加载失败');
    };

    img.src = imageUrl;
  });
};

const extractText = async () => {
  if (!thumbnailSrc.value) {
    message.warning('请先上传图片');
    return;
  }

  extractLoading.value = true;
  try {
    await extractHiddenTextFromImage(thumbnailSrc.value);
    message.success('文本提取成功');
  } catch (e) {
    message.error('提取失败: ' + e.message);
    console.error(e);
  } finally {
    extractLoading.value = false;
  }
};

const extractHiddenTextFromImage = (imageUrl) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      let extractedBinary = "";
      // 提取所有最低有效位
      for (let i = 0; i < pixels.length; i += 4) {
        extractedBinary += (pixels[i] & 1).toString();
      }

      // 改进的文本提取
      extractedText.value = binaryToText(extractedBinary);
      resolve();
    };

    img.onerror = () => {
      throw new Error('图片加载失败');
    };

    img.src = imageUrl;
  });
};

// 辅助方法
const textToBinary = (text) => {
  return [...text].map(char => {
    return char.charCodeAt(0).toString(2).padStart(8, '0');
  }).join('');
};

const binaryToText = (binaryString) => {
  const terminatorPos = binaryString.indexOf(terminatorBinary.value);
  if (terminatorPos === -1) return '未检测到隐藏文本或数据损坏';
  
  const validBinary = binaryString.substring(0, terminatorPos);
  let text = '';
  
  // 确保按8位一组处理
  for (let i = 0; i < validBinary.length; i += 8) {
    const byte = validBinary.substr(i, 8);
    if (byte.length === 8) {
      text += String.fromCharCode(parseInt(byte, 2));
    }
  }
  return text;
};

const downloadImage = (canvas) => {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `hidden_${Date.now()}.png`;
  link.click();
};
</script>

<style scoped>
.steganography-card {
  width: 100%;
  margin: 20px auto;
}

.upload-area {
  margin: 16px 0;
}

.upload-area :deep(.ant-upload) {
  width: 100%;
  height: 160px;
}

.file-info {
  margin: 16px 0;
}

.action-buttons {
  display: flex;
  justify-content: center;
  margin: 24px 0;
  gap: 16px;
}

.result-card {
  margin-top: 24px;
}
</style>