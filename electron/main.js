const { ElectronEgg } = require("ee-core");
const { Lifecycle } = require("./preload/lifecycle");
const { preload } = require("./preload");
const { BrowserWindow, Menu, MenuItem, session, ipcMain } = require("electron");
// const pkg = require('../package.json');
const path = require("path");
const pkg = require(path.join(__dirname, "../../package.json"));
const log = require(path.join(__dirname, "../../changeLog.json"));
const fs = require("fs");

// new app
const app = new ElectronEgg();

// register lifecycle
const life = new Lifecycle();
app.register("ready", life.ready);
app.register("electron-app-ready", life.electronAppReady);
app.register("window-ready", life.windowReady);
app.register("before-close", () => {
  life.beforeClose;
});
var appCache = async () => {
  const { app } = require("electron");
  let cache = app.getPath("cache");
  // 获取缓存的路径
  const cachePath = path.join(cache, pkg.name);
  // 清理缓存目录下的文件
  if (fs.existsSync(cachePath)) {
    console.log("清理缓存目录下的文件", cachePath);
    var deletePath = ["blob_storage", "Code Cache", "Cache"];
    for (var i = 0; i < deletePath.length; i++) {
      deleteDirectoryRecursive(path.join(cachePath, deletePath[i]));
    }
  }
};
appCache();
// 使用promises API避免阻塞主进程（替换原同步方法）
async function deleteDirectoryRecursive(directoryPath) {
  if (await fs.promises.access(directoryPath).catch(() => false)) {
    const files = await fs.promises.readdir(directoryPath);
    await Promise.all(
      files.map(async (file) => {
        const curPath = path.join(directoryPath, file);
        if ((await fs.promises.lstat(curPath)).isDirectory()) {
          await deleteDirectoryRecursive(curPath);
        } else {
          await fs.promises.unlink(curPath);
        }
      })
    );
    await fs.promises.rmdir(directoryPath);
  }
}

// register preload
app.register("preload", preload);

const template = [
  {
    label: "牛马工具",
    submenu: [
      { label: "复制", accelerator: "CmdorCtrl+C", role: "copy" },
      { label: "撤销", accelerator: "CmdorCtrl+Z", role: "undo" },
      { label: "剪切", accelerator: "CmdorCtrl+X", role: "cut" },
      { label: "粘贴", accelerator: "CmdorCtrl+V", role: "paste" },
      { label: "全选", accelerator: "CmdorCtrl+A", role: "selectAll" },
      { label: "刷新", accelerator: "CmdorCtrl+R", role: "reload" },
      {
        label: "退出",
        accelerator: "CmdOrCtrl+Q",
        click: () => {
          const { app } = require("electron");
          app.quit();
        },
      },
    ],
  },
  {
    label: "帮助",
    submenu: [
      {
        label: "更新信息",
        click: () => {
          // 创建浏览器窗口
          const win = new BrowserWindow({
            width: 500,
            height: 400,
            webPreferences: {
              nodeIntegration: true,
            },
            modal: true,
            autoHideMenuBar: true,
          });

          // 加载自定义 HTML
          win.loadURL(formatChangelog());
        },
      },
      {
        label: "关于",
        click: () => {
          const dialogOptions = {
            type: "info",
            title: "关于",
            message: `${pkg.productName || pkg.name}`,
            detail: `版本号：${pkg.version}\n作者：${pkg.author || ""}\n描述：${
              pkg.description || ""
            }`,
          };
          require("electron").dialog.showMessageBox(dialogOptions);
        },
      },
    ],
  },
];
// 设置顶部菜单，当前设置为关闭话状态
const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

ipcMain.on("app-quit", () => {
  const { app } = require("electron");
  app.quit();
});

const { net } = require("electron");
ipcMain.handle("api-request", async (event, { url, method, data, token }) => {
  const request = net.request({
    method,
    url: `https://dida.homedo.com${url}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
  });

  return new Promise((resolve) => {
    let body = "";
    request.on("response", (response) => {
      response.on("data", (chunk) => (body += chunk));
      response.on("end", () => resolve(JSON.parse(body)));
    });
    request.end(JSON.stringify(data));
  });
});

ipcMain.handle(
  "api-user-request",
  async (event, { url, method, data, token }) => {
    const request = net.request({
      method,
      url: url,
      headers: {
        "Content-Type": "application/json",
      },
    });

    return new Promise((resolve) => {
      let body = "";
      request.on("response", (response) => {
        response.on("data", (chunk) => (body += chunk));
        response.on("end", () => resolve(JSON.parse(body)));
      });
      request.end(JSON.stringify(data));
    });
  }
);

ipcMain.handle("api-getVersion", async () => {
  const data = {
    name: `${pkg.productName || pkg.name}`,
    version: `${pkg.version || "0"} `,
  };
  return data;
});

// run
app.run();

// 修改 formatChangelog 函数
function formatChangelog() {
  return `data:text/html;charset=UTF-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <!-- 引入 Element 样式 -->
      <link rel="stylesheet" href="https://unpkg.com/element-ui/lib/theme-chalk/index.css">
      <style>
        .el-timeline {
          margin: 20px;
        }
        .el-card {
          margin-bottom: 20px;
        }
        body {
          background-color: #f5f7fa;
        }
      </style>
    </head>
    <body>
      <div id="app">
        <el-timeline>
          ${generateTimelineItems()}
        </el-timeline>
      </div>

      <!-- 引入 Vue -->
      <script src="https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.js"></script>
      <!-- 引入 Element 组件库 -->
      <script src="https://unpkg.com/element-ui/lib/index.js"></script>
      
      <script>
        new Vue({
          el: '#app',
          created() {
            // 初始化 Element 组件
            ELEMENT.locale(ELEMENT.lang.zhCN)
          }
        })
      </script>
    </body>
    </html>
  `)}`;

  // 生成时间线项的函数
  function generateTimelineItems() {
    try {
      const changelogData = require('../../changeLog.json');
      return changelogData
        .map(item => `
          <el-timeline-item timestamp="${item.date}" placement="top">
            <el-card>
              <h4>${item.title}</h4>
              <p>${item.description}</p>
              <div style="color: #909399;font-size:12px;">
                ${item.author} 提交于 ${item.time}
              </div>
            </el-card>
          </el-timeline-item>
        `).join('');
    } catch (e) {
      return `
        <el-timeline-item timestamp="暂无数据" placement="top">
          <el-card>
            <h4>初始化版本</h4>
            <p>系统初始版本</p>
          </el-card>
        </el-timeline-item>
      `;
    }
  }
}