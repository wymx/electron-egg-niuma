<template>
    <a-card title="文本隐写工具" :bordered="false" class="steganography-card">
        <!-- 加密区域 -->
        <a-divider orientation="left">加密 🔒</a-divider>
        <a-form layout="vertical">
            <a-form-item label="将要嵌入密文的明文">
                <a-textarea v-model:value="state.text" placeholder="输入文本" :auto-size="{ minRows: 2, maxRows: 4 }"
                    allow-clear />
            </a-form-item>

            <a-form-item label="嵌入的密文">
                <a-textarea v-model:value="state.hiddenText" placeholder="输入隐藏的文本"
                    :auto-size="{ minRows: 2, maxRows: 4 }" allow-clear />
            </a-form-item>

            <a-form-item>
                <a-button type="primary" block @click="encodeStr" :disabled="!state.text || !state.hiddenText">
                    <template #icon>
                        <LockOutlined />
                    </template>
                    生成隐写文本
                </a-button>
            </a-form-item>

            <a-form-item label="生成的隐写文本">
                <a-textarea v-model:value="state.cipherText" placeholder="生成的隐写文本"
                    :auto-size="{ minRows: 2, maxRows: 4 }" allow-clear read-only />
            </a-form-item>
        </a-form>

        <!-- 解密区域 -->
        <a-divider orientation="left">解密 🔓</a-divider>
        <a-form layout="vertical">
            <a-form-item label="将隐写后的文本粘贴到这里">
                <a-textarea v-model:value="state.tempText" placeholder="将生成的隐写文本粘贴到这里"
                    :auto-size="{ minRows: 2, maxRows: 4 }" allow-clear @input="decodeStr" />
            </a-form-item>

            <a-form-item label="解析出的密文">
                <a-alert :message="state.decodeText || '未解析出内容'" :type="state.decodeText ? 'success' : 'info'" show-icon
                    class="result-box" />
            </a-form-item>

            <a-form-item>
                <a-button type="default" block @click="reset">
                    <template #icon>
                        <RedoOutlined />
                    </template>
                    重置
                </a-button>
            </a-form-item>
        </a-form>
    </a-card>
</template>

<script setup>
import { reactive } from 'vue';

const state = reactive({
    text: '',       // 明文
    hiddenText: '', // 隐写的隐藏文本
    cipherText: '', // 隐写后的密文
    tempText: '',   // 临时的复制文本框
    decodeText: ''  // 解密后的文本
});

function reset() {
    state.text = '';
    state.hiddenText = '';
    state.cipherText = '';
    state.tempText = '';
    state.decodeText = '';
}

const INTERNAL_SALT = "MySecureSaltValue123!@#"; // 自定义的固定盐值
function applySalt(text) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const saltChar = INTERNAL_SALT.charCodeAt(i % INTERNAL_SALT.length);
        result += String.fromCharCode(text.charCodeAt(i) ^ saltChar);
    }
    return result;
}
// 解盐函数（与加盐逻辑相同，因为XOR是可逆的）
function removeSalt(text) {
  return applySalt(text); // XOR操作是可逆的，相同函数即可
}
function encodeStr() {

    const saltedHiddenText = applySalt(state.hiddenText);
    console.log(saltedHiddenText, 'saltedHiddenText');


    let tempStrArr = state.text.split('');
    tempStrArr.splice(
        1,
        0,
        saltedHiddenText
            .split('')
            .map((char) => char.codePointAt(0).toString(2))
            .join(' ')
            .split('')
            .map((binaryNum) => {
                if (binaryNum === '1') return String.fromCharCode(8203);
                if (binaryNum === '0') return String.fromCharCode(8204);
                return String.fromCharCode(8205);
            })
            .join(String.fromCharCode(8206))
    );
    state.cipherText = tempStrArr.join('');
}

function decodeStr() {
    if (!state.tempText) {
        state.decodeText = '';
        return;
    }

    const hiddenText = state.tempText.replace(
        /[^\u200b-\u200f\uFEFF\u202a-\u202e]/g, ''
    );

    const decodedText = hiddenText
        .split('‎')
        .map((char) => {
            if (char === '​') return '1';
            if (char === '‌') return '0';
            return ' ';
        })
        .join('')
        .split(' ')
        .map((binaryNum) => String.fromCharCode(parseInt(binaryNum, 2)))
        .join('');

        // 对解密出的文本进行解盐处理
    state.decodeText = removeSalt(decodedText);
}
</script>

<style scoped>
.steganography-card {
    width: 100%;
    margin: 0 auto;
    padding: 24px;
}

.result-box {
    min-height: 80px;
    display: flex;
    align-items: center;
}

:deep(.ant-divider) {
    margin: 24px 0;
}

:deep(.ant-form-item) {
    margin-bottom: 16px;
}
</style>