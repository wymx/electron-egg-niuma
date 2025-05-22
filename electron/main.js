const { ElectronEgg } = require("ee-core");
const { Lifecycle } = require("./preload/lifecycle");
const { preload } = require("./preload");
const { Menu, MenuItem, session, ipcMain } = require("electron");
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
    var deletePath = ["blob_storage", "Code Cache","Cache"];
    for (var i = 0; i < deletePath.length; i++) {
      deleteDirectoryRecursive(path.join(cachePath, deletePath[i]));
    }
  }
}
appCache()
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
