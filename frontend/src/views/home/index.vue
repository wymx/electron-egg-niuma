<!-- frontend/src/views/home/index.vue -->
<template>
  <a-config-provider :theme="theme">
    <div class="room-container">
      <!-- 用户名称设置 -->
      <!-- <a-modal 
        :visible="!userName" 
        title="设置您的昵称" 
        :footer="null"
        :closable="false"
        centered
      >
        <a-space direction="vertical" style="width: 100%">
          <a-input 
            v-model:value="tempUserName" 
            placeholder="输入昵称" 
            :maxlength="20"
            @pressEnter="setUserName"
          />
          <a-button type="primary" block @click="setUserName">确认</a-button>
        </a-space>
      </a-modal> -->

      <div v-if="!userName" class="user-setup">
            <h2>设置您的昵称</h2>
            <!-- <input v-model="tempUserName" placeholder="输入昵称" maxlength="20" />
            <button @click="setUserName">确认</button> -->
            <a-space direction="vertical" style="width: 100%">
          <a-input 
            v-model:value="tempUserName" 
            placeholder="输入昵称" 
            :maxlength="20"
            @pressEnter="setUserName"
          />
          <a-button type="primary" block @click="setUserName">确认</a-button>
        </a-space>
        </div>

      <!-- 主房间界面 -->
      <div v-if="userName" class="room-main">
        <a-page-header
          title="聊天室"
          :sub-title="`当前用户: ${userName}`"
          class="room-header"
        >
          <template #extra>
            <a-space>
              <a-button 
                v-if="!currentRoom" 
                type="primary" 
                @click="showCreateRoom = true"
              >
                创建房间
              </a-button>
              <a-button 
                v-if="!currentRoom" 
                @click="showJoinRoom = true"
              >
                加入房间
              </a-button>
              <a-button 
                v-else 
                danger 
                @click="leaveRoom"
              >
                离开房间
              </a-button>
            </a-space>
          </template>
        </a-page-header>

        <!-- 创建房间对话框 -->
        <a-modal
          v-model:visible="showCreateRoom"
          title="创建新房间"
          @ok="createRoom"
          @cancel="showCreateRoom = false"
          centered
        >
          <a-form layout="vertical">
            <a-form-item label="房间名称(可选)">
              <a-input v-model:value="newRoomName" />
            </a-form-item>
          </a-form>
        </a-modal>

        <!-- 加入房间对话框 -->
        <a-modal
          v-model:visible="showJoinRoom"
          title="加入已有房间"
          @cancel="showJoinRoom = false"
          width="800px"
          centered
        >
          <a-empty v-if="roomList.length === 0" description="没有可用的房间" />
          <a-list 
            v-else 
            :dataSource="roomList" 
            :loading="loading"
            class="room-list"
          >
            <template #header>
              <a-space>
                <a-button @click="refreshRoomList">刷新列表</a-button>
                <span>共 {{ roomList.length }} 个房间</span>
              </a-space>
            </template>
            <template #renderItem="{ item }">
              <a-list-item class="room-item">
                <a-list-item-meta
                  :title="item.name || '未命名房间'"
                  :description="`房间码: ${item.code} | 人数: ${item.clients || 0}`"
                />
                <template #actions>
                  <a-button type="link" @click="joinRoom(item.code)">加入</a-button>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-modal>

        <!-- 房间聊天区 -->
        <a-card v-if="currentRoom" class="room-chat" :bordered="false">
          <template #title>
            <a-space direction="vertical" style="width: 100%">
              <h3>{{ currentRoom.name || currentRoom.code }}</h3>
              <a-descriptions size="small" :column="2">
                <a-descriptions-item label="房主">{{ currentRoom.creator }}</a-descriptions-item>
                <a-descriptions-item label="成员">{{ currentRoom.members?.join(', ') || '无成员' }}</a-descriptions-item>
              </a-descriptions>
            </a-space>
          </template>

          <div class="message-list">
            <a-list
              :dataSource="messages"
              itemLayout="vertical"
              class="message-container"
            >
              <template #renderItem="{ item }">
                <a-list-item 
                  class="message" 
                  :class="{ own: item.sender === userName }"
                >
                  <a-list-item-meta
                    :title="item.sender"
                    :description="formatTime(item.timestamp)"
                  />
                  <div class="message-content">
                    {{ item.content }}
                  </div>
                </a-list-item>
              </template>
            </a-list>
          </div>

          <div class="message-input">
            <a-input 
              v-model:value="newMessage" 
              placeholder="输入消息..." 
              @pressEnter="sendMessage"
            >
              <template #suffix>
                <a-button 
                  type="primary" 
                  :disabled="!newMessage.trim()" 
                  @click="sendMessage"
                >
                  发送
                </a-button>
              </template>
            </a-input>
          </div>
        </a-card>
      </div>
    </div>
  </a-config-provider>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { message as antMessage } from 'ant-design-vue';
const { ipcRenderer } = require('electron');

// 主题配置
const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 4,
  }
};

// 用户信息
const tempUserName = ref('');
const userName = ref('');
const setUserName = () => {
  if (tempUserName.value.trim()) {
    userName.value = tempUserName.value;
  } else {
    antMessage.warning('请输入昵称');
  }
};

// 房间信息
const currentRoom = ref(null);
const newRoomName = ref('');
const showCreateRoom = ref(false);
const showJoinRoom = ref(false);
const roomList = ref([]);
const roomCode = ref('');
const messages = ref([]);
const newMessage = ref('');
const loading = ref(false);

// WebSocket连接
let ws = null;
const wsPort = ref(null);

// 获取动态端口
onMounted(async () => {
  try {
    wsPort.value = await ipcRenderer.invoke('get-ws-port');
    setInterval(refreshRoomList, 5000);
  } catch (error) {
    antMessage.error('获取端口失败: ' + error.message);
  }
});

// 创建房间
const createRoom = async () => {
  try {
    if (!userName.value) {
      antMessage.warning('请先设置昵称');
      return;
    }
    
    roomCode.value = await ipcRenderer.invoke('create-room', userName.value, newRoomName.value);
    currentRoom.value = {
      code: roomCode.value,
      name: newRoomName.value,
      creator: userName.value,
      members: [userName.value]
    };

    connectWebSocket();
    showCreateRoom.value = false;
    newRoomName.value = '';
    antMessage.success('房间创建成功!');
  } catch (error) {
    antMessage.error('创建房间失败: ' + error.message);
  }
};

// 加入房间
const joinRoom = async (code) => {
  try {
    roomCode.value = code;
    const roomInfo = roomList.value.find(r => r.code === code);
    currentRoom.value = {
      code,
      name: roomInfo?.name,
      creator: roomInfo?.creator,
      members: roomInfo?.members || []
    };

    connectWebSocket();
    showJoinRoom.value = false;
    antMessage.success('成功加入房间!');
  } catch (error) {
    antMessage.error('加入房间失败: ' + error.message);
  }
};

// 离开房间
const leaveRoom = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
  ipcRenderer.invoke('leave-room', roomCode.value, userName.value);
  currentRoom.value = null;
  messages.value = [];
  antMessage.info('已离开房间');
};

// 刷新房间列表
const refreshRoomList = async () => {
  try {
    loading.value = true;
    roomList.value = await ipcRenderer.invoke('get-room-list') || [];
  } catch (error) {
    antMessage.error('获取房间列表失败: ' + error.message);
    roomList.value = [];
  } finally {
    loading.value = false;
  }
};

// 连接WebSocket
const connectWebSocket = () => {
  ws = new WebSocket(`ws://localhost:${wsPort.value}`);

  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: 'join-room',
      roomCode: roomCode.value,
      userName: userName.value
    }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case 'joined':
        currentRoom.value.members = data.members || [];
        messages.value.push({
          sender: '[系统]',
          content: `${userName.value} 加入了房间`,
          timestamp: Date.now()
        });
        break;

      case 'message':
        messages.value.push(data);
        break;

      case 'room-closed':
        messages.value.push({
          sender: '[系统]',
          content: data.message,
          timestamp: Date.now()
        });
        currentRoom.value = null;
        if (ws) ws.close();
        antMessage.warning(data.message);
        break;
    }
  };

  ws.onclose = () => {
    messages.value.push({
      sender: '[系统]',
      content: '连接已关闭',
      timestamp: Date.now()
    });
  };

  ws.onerror = (error) => {
    antMessage.error('WebSocket连接错误: ' + error.message);
  };
};

// 发送消息
const sendMessage = () => {
  if (!newMessage.value.trim()) {
    antMessage.warning('消息不能为空');
    return;
  }
  
  if (!ws || ws.readyState !== ws.OPEN) {
    antMessage.error('连接未就绪');
    return;
  }

  const message = {
    type: 'message',
    roomCode: roomCode.value,
    content: newMessage.value,
    sender: userName.value,
    timestamp: Date.now()
  };

  ws.send(JSON.stringify(message));
  messages.value.push(message);
  newMessage.value = '';
};

// 格式化时间
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString();
};
</script>

<style scoped>
.room-container {
  padding: 20px;
  /* max-width: 1200px; */
  margin: 0 auto;
}

.room-header {
  background: #fff;
  padding: 16px 24px;
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
}

.room-list {
  max-height: 400px;
  overflow-y: auto;
}

.room-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.room-chat {
  height: calc(100vh - 220px);
  display: flex;
  flex-direction: column;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #fafafa;
}

.message-container {
  background: #fff;
  border-radius: 8px;
  padding: 8px;
}

.message {
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 4px;
  background-color: #f5f5f5;
}

.message.own {
  background-color: #e6f7ff;
  text-align: right;
}

.message-content {
  margin-top: 8px;
  word-break: break-word;
}

.message-input {
  padding: 16px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

:deep(.ant-list-item-meta-title) {
  margin-bottom: 0;
}

:deep(.ant-list-item-meta-description) {
  font-size: 12px;
  color: #888;
}
</style>