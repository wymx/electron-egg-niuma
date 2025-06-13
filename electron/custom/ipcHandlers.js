const { ipcMain } = require("electron");
const { net } = require("electron");
const path = require("path");
const pkg = require(path.join(__dirname, "../../../package.json"));

// 应用命令处理
function registerAppHandlers() {
  ipcMain.on("app-quit", () => {
    const { app } = require("electron");
    app.quit();
  });
}

// API 请求处理
function registerApiHandlers() {
  // 通用请求
  ipcMain.handle("api-request", async (event, { url, method, data, token }) => {
    const request = net.request({
      method,
      url: `https://dida.homedo.com${url}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    return handleNetRequest(request, data);
  });

  // 用户相关请求
  ipcMain.handle("api-user-request", async (event, { url, method, data }) => {
    const request = net.request({
      method,
      url: url,
      headers: {
        "Content-Type": "application/json",
      },
    });

    return handleNetRequest(request, data);
  });
}

// 版本信息处理
function registerVersionHandler() {
  ipcMain.handle("api-getVersion", async () => ({
    name: `${pkg.productName || pkg.name}`,
    version: `${pkg.version || "0"} `,
  }));
}

// 公共请求处理方法
function handleNetRequest(request, data) {
  return new Promise((resolve) => {
    let body = "";
    request.on("response", (response) => {
      response.on("data", (chunk) => (body += chunk));
      response.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ code: 500, message: "响应解析失败" });
        }
      });
    });
    request.end(JSON.stringify(data));
  });
}

module.exports = {
  registerAppHandlers,
  registerApiHandlers,
  registerVersionHandler,
};
