const { ipcMain, dialog } = require("electron");
const { BrowserWindow, app } = require("electron");

const puppeteer = require("puppeteer-core");
async function runPuppeteerWithElectronChromium(pie) {
  ipcMain.handle(
    "puppeteer-scrape",
    async (event, url, dateRange, account, password) => {
      // 添加进度通知
      event.sender.send("puppeteer-progress", { status: "开始" });
      try {
        const browser = await pie.connect(app, puppeteer);
        const window = new BrowserWindow({
          width: 1200, // 初始宽度
          height: 800, // 初始高度
          show: false, // 可选：先隐藏窗口
        });
        await window.loadURL(url);
        const page = await pie.getPage(browser, window);

        await page.setRequestInterception(true);

        page.on("request", async (request) => {
          var url = request.url();
          if (
            url.includes(
              "/api/v2/UI/TableList?viewName=Attendance.SingleObjectListView.EmpAttendanceDataList"
            ) &&
            request.method() === "POST"
          ) {
            // const postData = await request.postData();
            // console.log(postData, "Request URL:", url);
            try {
              // 获取原始请求数据
              const originalPostData = request.postData() || "{}";
              const postDataObj = JSON.parse(originalPostData);

              //条数
              var tableData = postDataObj.table_data;
              var paging = tableData.paging;
              paging.capacity = 100;
              tableData.paging = paging;
              postDataObj.table_data = tableData;

              //搜索时间
              var searchData = postDataObj.search_data;

              var items = searchData.items || [];
              var newitems = [];
              for (let index = 0; index < items.length; index++) {
                var element = items[index];
                if (
                  element.name ===
                  "Attendance.AttendanceStatistics.SwipingCardDate"
                ) {
                  // element.text = "2025/05/01-2025/05/31";
                  // element.value = "2025/05/01-2025/05/31";
                  element.text = dateRange;
                  element.value = dateRange;
                }
                newitems.push(element);
              }
              searchData.items = newitems;

              // 修改参数
              postDataObj.search_data = searchData;
              // 重新构建请求
              const newPostData = JSON.stringify(postDataObj);
              // 继续请求并修改数据
              request.continue({
                postData: newPostData,
                headers: {
                  ...request.headers(),
                  "Content-Type": "application/json",
                },
              });
            } catch (error) {
              console.error("修改请求参数失败:", error);
              request.continue();
            }
          } else {
            request.continue();
          }
        });

        page.on("response", async (response) => {
          var url = response.url();
          if (
            //工作时长
            url.includes(
              "/api/v2/UI/TableList?viewName=Attendance.SingleObjectListView.EmpAttendanceDataList"
            ) &&
            response.request().method() === "POST" &&
            response.ok()
          ) {
            try {
              var data = await response.json();
              // var timeList = data.biz_data;
              console.log("API Success:");
              event.sender.send("puppeteer-progress", {
                status: "成功获取数据返回",
              });
              event.sender.send("puppeteer-data", data);
            } catch {
              console.log("API Success (non-JSON):", await response.text());
            }
          }
        });

        const cookies = await page.cookies();
        const isLoggedIn =
          cookies.some((c) => c.name === "Tita_PC") &&
          cookies.some((c) => c.name === "ssn_Tita_PC");
        console.log("Is logged in:", isLoggedIn);

        if (!isLoggedIn) {
          event.sender.send("puppeteer-progress", { status: "开始登录..." });

          await page.waitForSelector(".phoenix-checkbox__input");
          await page.$eval(".phoenix-checkbox__input", (checkbox) => {
            checkbox.value = "true";
            checkbox.checked = true;
            const eventEle = new Event("change", { bubbles: true });
            checkbox.dispatchEvent(eventEle);
          });

          await page.waitForSelector("#form-item-account");
          const accountElement = await page.$("#form-item-account");
          await accountElement.type(account, { delay: 30 });

          await page.waitForSelector("#form-item-password");
          const pwdElement = await page.$("#form-item-password");
          await pwdElement.type(password, { delay: 30 });

          await page.click(".login-home-ft>.phoenix-button");

          // 等待按钮出现
          await page.waitForSelector(
            ".phoenix-popconfirm__footerButton:nth-child(2) .phoenix-button__wraper",
            {
              visible: true,
              timeout: 10000,
            }
          );
          // 点击按钮
          await page.click(
            ".phoenix-popconfirm__footerButton:nth-child(2) .phoenix-button__wraper"
          );
        }
        event.sender.send("puppeteer-progress", {
          status: "登录成功，打开我的假勤页面...",
        });

        await page.waitForSelector(".MenuList .HomeDivStyle", {
          visible: true,
          timeout: 20000,
        });

        // 使用evaluate精确查找
        await page.evaluate(() => {
          const items = Array.from(document.querySelectorAll(".HomeDivStyle"));
          const target = items.find(
            (item) =>
              item.querySelector(".itemAppName")?.textContent.trim() ===
              "我的假勤"
          );
          if (target) {
            target.click();
          } else {
            throw new Error('未找到"我的假勤"元素');
          }
        });
        // 等待足够时间确保请求完成
        // 确保所有操作完成
        await new Promise(resolve => setTimeout(resolve, 5000));


        // 等待页面完全加载
        await page.waitForSelector(".out_view_item-innerText", {
          visible: true,
          timeout: 20000,
        });
        // 调整窗口到最适合截图的尺寸
        window.setSize(2200, 2200);
        await new Promise((resolve) => setTimeout(resolve, 500)); // 等待尺寸调整完成

        event.sender.send("puppeteer-progress", {
          status: "加载完成，网页截图中...",
        });
        // 获取页面截图
        const screenshot = await page.screenshot({
          fullPage: true,
          encoding: "base64",
        });
        event.sender.send("puppeteer-screenshot", screenshot);

        return { success: true };
      } catch (error) {
        event.sender.send("puppeteer-error", error.message);
        throw error;
      } finally {
      }
    }
  );

  ipcMain.handle("puppeteer-scrape2", async (event, url, account, password) => {
    // 添加进度通知
    event.sender.send("puppeteer-progress", { status: "开始执行...." });
    try {
      const browser = await pie.connect(app, puppeteer);
      const window = new BrowserWindow({
        width: 1200, // 初始宽度
        height: 800, // 初始高度
        show: false, // 可选：先隐藏窗口
      });
      await window.loadURL(url);
      const page = await pie.getPage(browser, window);

      await page.setRequestInterception(true);

      page.on("request", async (request) => {
        var url = request.url();
        if (
          url.includes(
            "/api/v2/UI/TableList?viewName=Attendance.SingleObjectListView.EmployeeVacationListView"
          ) &&
          request.method() === "POST"
        ) {
          try {
            // 获取原始请求数据
            const originalPostData = request.postData() || "{}";
            const postDataObj = JSON.parse(originalPostData);

            //条数
            var tableData = postDataObj.table_data;
            var paging = tableData.paging;
            paging.capacity = 1000;
            tableData.paging = paging;
            postDataObj.table_data = tableData;

            // 重新构建请求
            const newPostData = JSON.stringify(postDataObj);
            // 继续请求并修改数据
            request.continue({
              postData: newPostData,
              headers: {
                ...request.headers(),
                "Content-Type": "application/json",
              },
            });
          } catch (error) {
            console.error("修改请求参数失败:", error);
            request.continue();
          }
        } else {
          request.continue();
        }
      });

      page.on("response", async (response) => {
        var url = response.url();
        if (
          //请假
          url.includes(
            "/api/v2/UI/TableList?viewName=Attendance.SingleObjectListView.EmployeeVacationListView"
          ) &&
          response.request().method() === "POST" &&
          response.ok()
        ) {
          try {
            var data = await response.json();
            // var timeList = data.biz_data;
            event.sender.send("puppeteer-data2", data);
          } catch {
            console.log("API Success (non-JSON):", await response.text());
          }
        }
      });

      const cookies = await page.cookies();
      const isLoggedIn =
        cookies.some((c) => c.name === "Tita_PC") &&
        cookies.some((c) => c.name === "ssn_Tita_PC");
      console.log("Is logged in:", isLoggedIn);

      if (!isLoggedIn) {
        event.sender.send("puppeteer-progress", {
          status: "没有登录,开始登录....",
        });

        await page.waitForSelector(".phoenix-checkbox__input");
        await page.$eval(".phoenix-checkbox__input", (checkbox) => {
          checkbox.value = "true";
          checkbox.checked = true;
          const eventEle = new Event("change", { bubbles: true });
          checkbox.dispatchEvent(eventEle);
        });

        await page.waitForSelector("#form-item-account");
        const accountElement = await page.$("#form-item-account");
        await accountElement.type(account, { delay: 30 });

        await page.waitForSelector("#form-item-password");
        const pwdElement = await page.$("#form-item-password");
        await pwdElement.type(password, { delay: 30 });

        await page.click(".login-home-ft>.phoenix-button");

        // 等待按钮出现
        await page.waitForSelector(
          ".phoenix-popconfirm__footerButton:nth-child(2) .phoenix-button__wraper",
          {
            visible: true,
            timeout: 10000,
          }
        );
        // 点击按钮
        await page.click(
          ".phoenix-popconfirm__footerButton:nth-child(2) .phoenix-button__wraper"
        );
      }

      event.sender.send("puppeteer-progress", {
        status: "登录成功，打开休假页面...",
      });

      await page.waitForSelector(".MenuList .HomeDivStyle", {
        visible: true,
        timeout: 20000,
      });

      // 使用evaluate精确查找
      await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll(".HomeDivStyle"));
        const target = items.find(
          (item) =>
            item.querySelector(".itemAppName")?.textContent.trim() ===
            "我的假勤"
        );
        if (target) {
          target.click();
        } else {
          throw new Error('未找到"我的假勤"元素');
        }
      });
      // 等待足够时间确保请求完成
      // 确保所有操作完成
      await new Promise(resolve => setTimeout(resolve, 5000));


      // 等待页面完全加载
      await page.waitForSelector(".out_view_item-innerText", {
        visible: true,
        timeout: 20000,
      });

      // 改为使用更可靠的选择器查找"我的休假"
      await page.evaluate(() => {
        // 尝试多种查找方式
        let vacationLink = document.querySelector(
          'a.list-2nd-a[data-menuid="d02be399-0e59-4dc0-9045-ff85507b85ce"]'
        );

        if (!vacationLink) {
          vacationLink = Array.from(
            document.querySelectorAll(".list-2nd-a")
          ).find((item) => item.textContent.trim() === "我的休假");
        }

        if (vacationLink) {
          vacationLink.click();
        } else {
          throw new Error('未找到"我的休假"元素');
        }
      });

      await new Promise(resolve => setTimeout(resolve, 5000));


      event.sender.send("puppeteer-progress", {
        status: "加载完成，网页截图中...",
      });

      // 等待页面完全加载
      await page.waitForSelector(".viewListTitle", {
        visible: true,
        timeout: 20000,
      });

      // 调整窗口到最适合截图的尺寸
      window.setSize(2200, 2200);
      await new Promise((resolve) => setTimeout(resolve, 500)); // 等待尺寸调整完成

      // 获取页面截图
      const screenshot = await page.screenshot({
        fullPage: true,
        encoding: "base64",
      });
      event.sender.send("puppeteer-screenshot2", screenshot);

      return { success: true };
    } catch (error) {
      event.sender.send("puppeteer-error", error.message);
      throw error;
    } finally {
    }
  });

  // 在 electron/main.js 中添加
  ipcMain.handle("show-save-dialog", async (event, options) => {
    const result = await dialog.showSaveDialog(options);
    return result;
  });
}

module.exports = {
  runPuppeteerWithElectronChromium,
};
