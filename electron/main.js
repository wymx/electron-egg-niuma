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
} = require("./custom/ipcHandlers");
const {
  runPuppeteerWithElectronChromium,
} = require("./custom/chromeHandlers");

const {
  startTV,
  closeTV,
} = require("./custom/addTV");

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
  closeTV();
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
  runPuppeteerWithElectronChromium(pie);
  startTV();
}
initializeIpc();
// run
app.run();
