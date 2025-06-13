const { Menu, BrowserWindow, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const pkg = require(path.join(__dirname, "../../../package.json"));

module.exports = {
  createMenu: () => {
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
              const win = new BrowserWindow({
                title: `更新日志`,
                width: 500,
                height: 400,
                webPreferences: {
                  webSecurity: false,
                  allowRunningInsecureContent: true,
                  nodeIntegration: false,
                  contextIsolation: true,
                },
                modal: true,
                autoHideMenuBar: true,
              });
              win.loadURL(await formatChangelog());
            },
          },
          {
            label: "关于",
            click: () => {
              dialog.showMessageBox({
                type: "info",
                title: "关于",
                message: `${pkg.productName || pkg.name}`,
                detail: `版本号：${pkg.version}\n作者：${
                  pkg.author || ""
                }\n描述：${pkg.description || ""}`,
              });
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    // 修改 formatChangelog 函数
    async function formatChangelog() {
      // 首次加载或更新资源
      var cssPath = path.join(
        __dirname,
        "../../../resources/element-ui/index.css"
      );
      var jsPath = path.join(
        __dirname,
        "../../../resources/element-ui/index.js"
      );
      var vuePath = path.join(__dirname, "../../../resources/vue/vue.js");

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
    }
    // 生成时间线项的函数
    function generateTimelineItems() {
      try {
        const changelogData = require("../../../changeLog.json");
        return changelogData
          .map(
            (item) => `
          <el-timeline-item timestamp="${item.date}" placement="top">
            <el-card>
              <h4>${item.title}</h4>
              ${formatDescription(item.description)}
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

    // 新增函数：格式化描述文本为多行/多标签
    function formatDescription(desc) {
      if (!desc) return "<p></p>";
      // 按换行符分割描述文本
      const lines = desc.split("\n").filter((line) => line.trim());
      // 为每行内容生成标签
      return lines
        .map((line) => {
          // 检查是否是标签格式（如 "[标签] 内容"）
          const tagMatch = line.match(/^\[(.*?)\]\s*(.*)/);
          if (tagMatch) {
            const [_, tag, content] = tagMatch;
            return `
        <div style="margin: 5px 0;">
          <el-tag size="small" type="info">${tag}</el-tag>
          <span style="margin-left: 5px;">${content}</span>
        </div>
      `;
          }
          // 普通文本行
          return `<p style="margin: 5px 0;">${line}</p>`;
        })
        .join("");
    }
  },
};
