// electron/custom/changeOpacity.js
const { BrowserWindow, ipcMain } = require("electron");

const windows = new Set();
// 添加一个专门存储链接窗口的集合
const linkWindows = new Set();
// 保存当前透明度值
let currentOpacity = 1.0;

function setAllWindowsOpacity(opacity) {
  currentOpacity = opacity;

  for (const window of windows) {
    if (!window.isDestroyed()) {
      window.setOpacity(opacity);
    }
  }

  // 通知所有窗口透明度已更改
  for (const window of windows) {
    if (!window.isDestroyed()) {
      window.webContents.send("opacity-changed", opacity);
    }
  }
}

// 当创建新窗口时，自动应用当前透明度
function applyCurrentOpacityToWindow(window) {
  if (window && !window.isDestroyed()) {
    window.setOpacity(currentOpacity);
  }
}

// 在创建窗口的函数中调用
function createLinkWindow(url) {
  const linkWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    transparent: false, // 启用透明，这里改成false才能显示弹窗的关闭按钮
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  windows.add(linkWindow);
  linkWindows.add(linkWindow); // 添加到链接窗口集合

  // 应用当前透明度
  applyCurrentOpacityToWindow(linkWindow);

  // 加载URL
  linkWindow.loadURL(url);

  linkWindow.on("closed", () => {
    windows.delete(linkWindow);
    linkWindows.delete(linkWindow); // 从链接窗口集合中移除
  });

  return linkWindow;
}

function changeOpacity() {
  // IPC 处理程序
  ipcMain.handle("set-window-opacity", (event, opacity) => {
    setAllWindowsOpacity(opacity);
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setOpacity(opacity);
      // windows.add(win);
      return true;
    }
    return true;
  });

  ipcMain.handle("get-window-opacity", () => {
    return currentOpacity;
  });

  ipcMain.handle("close-url-window", () => {
    for (const window of linkWindows) {
      if (!window.isDestroyed()) {
        window.close();
      }
    }
    // 清空链接窗口集合
    linkWindows.clear();
    return true;
  });

  // 添加打开链接的 IPC 处理程序
  ipcMain.handle("open-link-in-window", (event, url) => {
    try {
      const linkWindow = createLinkWindow(url);
      return true;
    } catch (error) {
      console.error("创建链接窗口失败:", error);
      return false;
    }
  });
}

module.exports = {
  changeOpacity,
};
