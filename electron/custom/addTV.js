const { BrowserWindow,ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let serverProcess = null; // 添加变量声明
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  setTimeout(() => {
      mainWindow.loadURL('http://localhost:8999');
  }, 200); // 延时2秒加载，确保服务已启动
}
function startExpressServer() {
  // 修正路径，确保正确指向 server.mjs
  const serverPath = path.join(__dirname, '..', 'LibreTV', 'server.mjs');
  
  serverProcess = spawn('node', [serverPath], {
    cwd: path.join(__dirname, '..', 'LibreTV'), // 设置工作目录为 LibreTV 目录
    stdio: 'inherit' // 输出到 Electron 主进程控制台
  });

  serverProcess.on('error', (err) => {
    console.error('启动服务进程失败:', err);
  });

  serverProcess.on('close', (code) => {
    console.log(`服务进程退出，退出码 ${code}`);
  });
  
  // 添加退出事件监听
  serverProcess.on('exit', (code, signal) => {
    console.log(`服务进程退出，退出码: ${code}, 信号: ${signal}`);
  });
}

function startTV() {
  startExpressServer();
  registeOpenTv();
}

function closeTV() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}
// 应用命令处理
function registeOpenTv() {
  ipcMain.on("open-tv", () => {
    createWindow()
  });
}


module.exports = {
  startTV,
  closeTV,
};