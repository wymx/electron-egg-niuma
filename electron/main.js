const { ElectronEgg } = require("ee-core");
const { Lifecycle } = require("./preload/lifecycle");
const { preload } = require("./preload");
const { BrowserWindow, Menu, MenuItem, session, ipcMain } = require("electron");
// const pkg = require('../package.json');
const path = require("path");
const pkg = require(path.join(__dirname, "../../package.json"));
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
        click: async () => {
          // 创建浏览器窗口
          const win = new BrowserWindow({
            title: `更新日志`,
            width: 500,
            height: 400,
            webPreferences: {
              webSecurity: false, // 允许本地资源加载
              allowRunningInsecureContent: true, // 允许混合内容
              nodeIntegration: false,
              contextIsolation: true,
            },
            modal: true,
            autoHideMenuBar: true,
          });
          // 加载自定义 HTML
          win.loadURL(await formatChangelog());
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
async function formatChangelog() {
  // 首次加载或更新资源
  var cssPath = path.join(__dirname, "../../resources/element-ui/index.css");
  var jsPath = path.join(__dirname, "../../resources/element-ui/index.js");
  var vuePath = path.join(__dirname, "../../resources/vue/vue.js");

  const cssContent = await fs.promises.readFile(cssPath, "utf-8");
  const vueContent = await fs.promises.readFile(vuePath, "utf-8");
  const jsContent = await fs.promises.readFile(jsPath, "utf-8");

  if (
    !fs.existsSync(cssPath) ||
    !fs.existsSync(jsPath) ||
    !fs.existsSync(vuePath)
  ) {
    console.log("资源文件不存在，请检查路径");
  }

  return `data:text/html;charset=UTF-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        [v-cloak] { display: none } 
        body { opacity: 0; transition: opacity 0.3s }
      </style>
      <style>${cssContent}</style>
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
      

      <script>
        ${vueContent}
        ${jsContent}
        document.addEventListener('DOMContentLoaded', () => {
          new Vue({
            el: '#app',
            created() {
              ELEMENT.locale(ELEMENT.lang.zhCN)
            },
            mounted() {
              document.body.style.opacity = 1
            }
          })
        })
      </script>
    </body>
    </html>
  `)}`;

  // 生成时间线项的函数
  function generateTimelineItems() {
    try {
      const changelogData = require("../../changeLog.json");
      return changelogData
        .map(
          (item) => `
          <el-timeline-item timestamp="${item.date}" placement="top">
            <el-card>
              <h4>${item.title}</h4>
              <p>${item.description}</p>
              <div style="color: #909399;font-size:12px;">
                ${item.author} 提交于 ${item.time}
              </div>
            </el-card>
          </el-timeline-item>
        `
        )
        .join("");
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
