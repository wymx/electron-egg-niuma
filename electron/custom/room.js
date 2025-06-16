// main.js 追加代码
const WebSocket = require("ws");
const bonjour = require("bonjour")();

const rooms = new Map();
const server = require("http").createServer(); // 新增 HTTP 服务器
const wss = new WebSocket.Server({ server }); // 绑定到 HTTP 服务器
const activeRooms = new Map(); // 房间码 -> {clients, creator}

// wss.on('connection', (ws) => {
//   ws.on('message', (rawData) => {
//     const data = JSON.parse(rawData);

//     // 加入房间请求
//     if (data.type === 'join-room') {
//       if (!rooms.has(data.roomCode)) {
//         ws.send(JSON.stringify({ type: 'error', message: '房间不存在' }));
//         return;
//       }
//       rooms.get(data.roomCode).add(ws);
//       ws.send(JSON.stringify({ type: 'joined', roomCode: data.roomCode }));
//     }

//     // 转发消息给同房间用户
//     if (data.type === 'message') {
//       const clients = rooms.get(data.roomCode);
//       clients.forEach(client => {
//         if (client !== ws && client.readyState === WebSocket.OPEN) {
//           client.send(JSON.stringify({
//             type: 'message',
//             content: data.content,
//             sender: data.sender
//           }));
//         }
//       });
//     }
//   });

//   ws.on('close', () => {
//     rooms.forEach((clients, roomCode) => {
//       if (clients.has(ws)) clients.delete(ws);
//     });
//   });
// });

// 在 IPC 中暴露接口
const { ipcMain } = require("electron");

module.exports = {
  initRoomService: () => {
    // 动态监听可用端口
    server.listen(0, () => {
      // 0 表示系统自动分配
      const port = server.address().port;
      console.log(`WebSocket 服务已启动，端口: ${port}`);

      // 将端口通知渲染进程（可选）
      ipcMain.handle("get-ws-port", () => port);
    });

    wss.on("connection", (ws) => {
      ws.on("message", (rawData) => {
        const data = JSON.parse(rawData);

        // 加入房间请求
        if (data.type === "join-room") {
          if (!rooms.has(data.roomCode)) {
            ws.send(JSON.stringify({ type: "error", message: "房间不存在" }));
            return;
          }
          // 记录用户信息
          ws.userName = data.userName;
          rooms.get(data.roomCode).add(ws);
          ws.send(
            JSON.stringify({
              type: "joined",
              roomCode: data.roomCode,
              members: Array.from(rooms.get(data.roomCode)).map(
                (c) => c.userName
              ), // 确保返回成员列表
            })
          );
        }

        // 转发消息给同房间用户
        if (data.type === "message") {
          const clients = rooms.get(data.roomCode);
          clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "message",
                  content: data.content,
                  sender: data.sender,
                })
              );
            }
          });
        }
      });

      ws.on("close", () => {
        rooms.forEach((clients, roomCode) => {
          if (clients.has(ws)) clients.delete(ws);
        });
      });
    });

    ipcMain.handle("create-room", (event, userName) => {
      const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
      rooms.set(roomCode, new Set());

      // 记录房主信息
      activeRooms.set(roomCode, {
        creator: event.sender,
        creatorName: userName, // 新增房主名称
        createdAt: Date.now(),
        service: null, // 新增服务引用
      });

      // 5分钟无活动自动清理
      setTimeout(() => {
        if (rooms.has(roomCode)) {
          rooms.delete(roomCode);
          activeRooms.delete(roomCode);
          console.log(`房间 ${roomCode} 已超时清理`);
        }
      }, 300000);

      // 发布 Bonjour 服务（关键修改）
      const service = bonjour.publish({
        name: `room-${roomCode}-${userName}`,
        type: "electron-room",
        port: server.address().port,
        txt: {
          code: roomCode,
          name: userName,
        },
      });
      activeRooms.get(roomCode).service = service;
      console.log(`房间 ${roomCode} 已创建，Bonjour 服务已发布`);

      return roomCode;
    });

    // 新增房间清理接口
    ipcMain.handle("leave-room", (event, roomCode) => {
      if (!activeRooms.has(roomCode)) return;

      const roomInfo = activeRooms.get(roomCode);

      // 只有房主可以清理房间
      if (roomInfo.creator === event.sender) {
        // 取消发布服务
        if (roomInfo.service) {
          roomInfo.service.stop(() => {
            console.log(`房间 ${roomCode} 服务已停止发布`);
          });
        }
        // 清理房间数据
        rooms.delete(roomCode);
        activeRooms.delete(roomCode);
        console.log(`房间 ${roomCode} 已手动清理`);

        // 通知所有客户端
        const clients = rooms.get(roomCode);
        if (clients) {
          clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "room-closed",
                  message: "房主已关闭房间",
                })
              );
            }
          });
        }
      }
    });

    // 新增获取房间列表接口
    ipcMain.handle("get-room-list", () => {
      return Array.from(activeRooms.keys()).map((code) => ({
        code,
        clients: rooms.get(code)?.size || 0,
        created: activeRooms.get(code).createdAt,
      }));
    });

    // 在 initRoomService 函数内添加
    ipcMain.handle("discover-rooms", () => {
      return new Promise((resolve) => {
        const browser = bonjour.find({ type: "electron-room" });
        const discoveredRooms = [];

        browser.on("up", (service) => {
          discoveredRooms.push({
            name: service.name.replace(/^room-\w+-/, ""), // 提取房间名
            code: service.txt.code,
            port: service.port,
            host: service.host,
          });
        });

        // 2秒后返回结果
        setTimeout(() => {
          resolve(discoveredRooms);
        }, 2000);
      });
    });
  },
};
