const { app: electronApp } = require("electron");
const { autoUpdater } = require("electron-updater");
const { is } = require("ee-core/utils");
const { logger } = require("ee-core/log");
const { getMainWindow, setCloseAndQuit } = require("ee-core/electron");
const path = require('path');
// 设置检测更新的地址
// if (!electronApp.isPackaged) {
//   // Object.defineProperty(electronApp, "isPackaged", {
//   // get: () => true,
//   // });
//   autoUpdater.forceDevUpdateConfig = true; // 强制使用开发环境的配置文件,期望代替更改isPackaged，以免影响其他业务
//   autoUpdater.updateConfigPath = path.join(__dirname, "dev-update.yml");
//   // 添加模拟签名配置
//   Object.defineProperty(autoUpdater, 'isForceCodeSigning', {
//     get: () => false,
//     set: () => {}
//   });
// }
  

/**
 * 自动升级
 * @class
 */
class AutoUpdaterService {
  constructor() {
    this.config = {
      windows: false,
      macOS: true,
      linux: false,
      options: {
        provider: "generic",
        url: "http://localhost:3000/ee/"
      },
    };
  }

  /**
   * 创建
   */
  create() {
    logger.info("[autoUpdater] load");
    const cfg = this.config;
    if (
      (is.windows() && cfg.windows) ||
      (is.macOS() && cfg.macOS) ||
      (is.linux() && cfg.linux)
    ) {
      // continue
    } else {
      return;
    }

    const status = {
      error: -1,
      available: 1,
      noAvailable: 2,
      downloading: 3,
      downloaded: 4,
    };

    const version = electronApp.getVersion();
    logger.info("[autoUpdater] current version: ", version);

    // 设置下载服务器地址
    let server = cfg.options.url;
    let lastChar = server.substring(server.length - 1);
    server = lastChar === "/" ? server : server + "/";
    cfg.options.url = server;

    try {
      autoUpdater.setFeedURL(cfg.options);
    } catch (error) {
      logger.error("[autoUpdater] setFeedURL error : ", error);
    }

    autoUpdater.on("checking-for-update", () => {
      const data = {
        status: status.available,
        desc: "正在检查更新...",
      };
      this.sendStatusToWindow(data);
      console.log("正在检查更新...");
    });
    autoUpdater.on("update-available", (info) => {
      console.log("有可用更新", info);
      const data = {
        status: status.available,
        desc: "有可用更新",
      };
      this.sendStatusToWindow(data);
    });
    autoUpdater.on("update-not-available", () => {
      const data = {
        status: status.noAvailable,
        desc: "没有可用更新",
      };
      this.sendStatusToWindow(data);
    });
    autoUpdater.on("error", (err) => {
      const data = {
        status: status.error,
        desc: err,
      };
      this.sendStatusToWindow(data);
    });
    autoUpdater.on("download-progress", (progressObj) => {
      const percentNumber = parseInt(progressObj.percent);
      const totalSize = this.bytesChange(progressObj.total);
      const transferredSize = this.bytesChange(progressObj.transferred);
      let text = "已下载 " + percentNumber + "%";
      text = text + " (" + transferredSize + "/" + totalSize + ")";

      const data = {
        status: status.downloading,
        desc: text,
        percentNumber,
        totalSize,
        transferredSize,
      };
      logger.info("[autoUpdater] progress: ", text);
      this.sendStatusToWindow(data);
    });
    autoUpdater.on("update-downloaded", () => {
      const data = {
        status: status.downloaded,
        desc: "下载完成",
      };
      this.sendStatusToWindow(data);

      // 托盘插件里面设置了阻止窗口关闭，这里设置允许关闭窗口
      setCloseAndQuit(true);

      // Install updates and exit the application
      autoUpdater.quitAndInstall();
    });
  }

  /**
   * 检查更新
   */
  checkUpdate() {
    autoUpdater.checkForUpdates();
  }

  /**
   * 下载更新
   */
  download() {
    autoUpdater.downloadUpdate();
  }

  /**
   * 向前端发消息
   */
  sendStatusToWindow(content = {}) {
    const textJson = JSON.stringify(content);
    const channel = "custom/app/updater";
    const win = getMainWindow();
    win.webContents.send(channel, textJson);
  }

  /**
   * 单位转换
   */
  bytesChange(limit) {
    let size = "";
    if (limit < 0.1 * 1024) {
      size = limit.toFixed(2) + "B";
    } else if (limit < 0.1 * 1024 * 1024) {
      size = (limit / 1024).toFixed(2) + "KB";
    } else if (limit < 0.1 * 1024 * 1024 * 1024) {
      size = (limit / (1024 * 1024)).toFixed(2) + "MB";
    } else {
      size = (limit / (1024 * 1024 * 1024)).toFixed(2) + "GB";
    }

    let sizeStr = size + "";
    let index = sizeStr.indexOf(".");
    let dou = sizeStr.substring(index + 1, index + 3);
    if (dou == "00") {
      return (
        sizeStr.substring(0, index) + sizeStr.substring(index + 3, index + 5)
      );
    }

    return size;
  }
}
AutoUpdaterService.toString = () => "[class AutoUpdaterService]";

module.exports = {
  autoUpdaterService: new AutoUpdaterService(),
};
