const { ElectronEgg } = require("ee-core");
const { Lifecycle } = require("./preload/lifecycle");
const { preload } = require("./preload");
const pie = require('puppeteer-in-electron');

const { createMenu } = require("./custom/menu"); // 导入菜单模块
const {
  registerAppHandlers,
  registerApiHandlers,
  registerVersionHandler,
  compressImage,
  saveImage,
  reloadAppHandlers,
} = require("./custom/ipcHandlers");
const {
  runPuppeteerWithElectronChromium,
} = require("./custom/chromeHandlers");
const {
  runPuppeteerWithElectronChromiumDayWork,
} = require("./custom/dayWorkHandlers");

const { cleanAppCache } = require("./custom/cacheCleaner");
cleanAppCache();

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

// register preload
app.register("preload", preload);

createMenu(); // 创建自定义菜单


pie.initialize(require("electron").app);
function initializeIpc() {
  registerAppHandlers();
  registerApiHandlers();
  registerVersionHandler();
  compressImage();
  saveImage();
  reloadAppHandlers();
  runPuppeteerWithElectronChromium(pie);
  runPuppeteerWithElectronChromiumDayWork(pie);
}
initializeIpc();
// run
app.run();
