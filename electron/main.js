const { ElectronEgg } = require("ee-core");
const { Lifecycle } = require("./preload/lifecycle");
const { preload } = require("./preload");
const { Menu, MenuItem, session, ipcMain } = require("electron");
// const pkg = require('../package.json');
const path = require("path");
const pkg = require(path.join(__dirname, "../../package.json"));

// new app
const app = new ElectronEgg();

// register lifecycle
const life = new Lifecycle();
app.register("ready", life.ready);
app.register("electron-app-ready", life.electronAppReady);
app.register("window-ready", life.windowReady);
app.register("before-close", ()=>{
    life.beforeClose

});

// register preload
app.register("preload", preload);

const template = [
  {
    label: "牛马工具",
    submenu: [
        { label: "复制", accelerator: "CmdorCtrl+C", role: "copy" },
        { label: "粘贴", accelerator: "CmdorCtrl+V", role: "paste" },
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

// run
app.run();
