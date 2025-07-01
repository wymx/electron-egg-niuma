const { ipcMain } = require("electron");
const { net } = require("electron");
const path = require("path");
const pkg = require(path.join(__dirname, "../../../package.json"));
const { dialog, app } = require("electron");
// 应用命令处理
function registerAppHandlers() {
  ipcMain.on("app-quit", () => {
    app.quit();
  });
  app.commandLine.appendSwitch("lang", "zh-CN");
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

  // ai审核
  ipcMain.handle("coze-api-request", async (event, { data }) => {
    // const request = net.request({
    //   method: "POST",
    //   url: "https://api.coze.cn/open_api/v1/web_chat",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Accept: "*/*",
    //     Origin: "https://api.coze.cn",
    //   },
    // });

    // return handleNetRequest(request, data); // 使用你已有的 handleNetRequest 方法

    const https = require('https');

    return new Promise((resolve, reject) => {
    try {
      const req = https.request('https://api.coze.cn/open_api/v1/web_chat', {
        headers: {
          accept: "*/*",
          "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
          "cache-control": "no-cache",
          "content-type": "application/json",
          pragma: "no-cache",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "sec-fetch-storage-access": "active",
        },
        method: "POST",
        body: data
      }, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk.toString();
        // 处理 SSE 数据格式
        const events = responseData.split('\n\n');
        events.forEach(event => {
          if (event.includes('data:')) {
            try {
              // const jsonData = JSON.parse(event.replace('data:', '').trim());
              // 处理单个事件数据
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        })
      })

      res.on('end', () => {
        resolve({
          code: 200,
          data: responseData
        });
      });

    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
    } catch (error) {
      reject(error);
    }
  });

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

const sharp = require("sharp");
// 压缩图片处理
function compressImage() {
  ipcMain.handle("compress-image", async (event, { imageData, options }) => {
    try {
      // 从 dataURL 提取 buffer
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
      const inputBuffer = Buffer.from(base64Data, "base64");

      // 计算新尺寸
      const metadata = await sharp(inputBuffer).metadata();
      // 修改尺寸计算逻辑
      let newWidth, newHeight;
      if (options.customWidth && options.customHeight) {
        newWidth = options.customWidth;
        newHeight = options.customHeight;
      } else {
        newWidth = Math.round(
          (metadata.width * options.resizePercentage) / 100
        );
        newHeight = Math.round(
          (metadata.height * options.resizePercentage) / 100
        );
      }

      // 压缩配置
      const sharpOptions = {
        quality: options.quality,
        compressionLevel: options.pngQuality,
      };

      // 根据格式处理
      let outputBuffer;
      switch (options.format) {
        case "jpeg":
          outputBuffer = await sharp(inputBuffer)
            .resize(newWidth, newHeight)
            .jpeg(sharpOptions)
            .toBuffer();
          break;
        case "png":
          outputBuffer = await sharp(inputBuffer)
            .resize(newWidth, newHeight)
            .png(sharpOptions)
            .toBuffer();
          break;
        case "webp":
          outputBuffer = await sharp(inputBuffer)
            .resize(newWidth, newHeight)
            .webp(sharpOptions)
            .toBuffer();
          break;
        default:
          throw new Error("不支持的输出格式");
      }

      // 修改后的压缩逻辑
      if (outputBuffer.length >= inputBuffer.length) {
        return {
          compressedData: imageData, // 返回原图
          size: inputBuffer.length,
          width: metadata.width,
          height: metadata.height,
        };
      }

      return {
        compressedData: `data:image/${
          options.format
        };base64,${outputBuffer.toString("base64")}`,
        size: outputBuffer.length,
        width: newWidth,
        height: newHeight,
      };
    } catch (error) {
      throw new Error("图片压缩失败: " + error.message);
    }
  });
}

// 保存图片处理 (与之前相同)
function saveImage() {
  ipcMain.handle("save-image", async (event, { dataUrl, defaultPath }) => {
    const fs = require("fs");
    const path = require("path");

    try {
      const { filePath } = await dialog.showSaveDialog({
        title: "保存压缩图片",
        defaultPath: path.join(app.getPath("downloads"), defaultPath),
        filters: [
          { name: "Images", extensions: ["jpg", "jpeg", "png", "webp"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (!filePath) return { success: false };

      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
      await fs.promises.writeFile(filePath, Buffer.from(base64Data, "base64"));

      return { success: true, filePath };
    } catch (error) {
      console.error("保存图片失败:", error);
      return { success: false };
    }
  });
}
module.exports = {
  registerAppHandlers,
  registerApiHandlers,
  registerVersionHandler,
  compressImage,
  saveImage,
};
