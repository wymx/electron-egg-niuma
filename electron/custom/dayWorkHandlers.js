const { ipcMain } = require("electron");
const { BrowserWindow, app } = require("electron");

const puppeteer = require("puppeteer-core");

var allEvent;
async function runPuppeteerWithElectronChromiumDayWork(pie) {
  // 检查是否已经注册过该处理器
  if (ipcMain.eventNames().includes("puppeteer-dayWork")) {
    console.log("puppeteer-dayWork 处理器已经注册，先移除旧的处理器");
    ipcMain.removeHandler("puppeteer-dayWork");
  }

  ipcMain.handle(
    "puppeteer-dayWork",
    async (event, url, formattedDate, dayconfig) => {
      allEvent = event;
      // 添加进度通知
      try {
        console.log("开始执行日报任务");
        // sendMessage(event, "开始");
        const browser = await pie.connect(app, puppeteer, {
          args: ["--incognito"],
        });

        const window = new BrowserWindow({
          width: 1200, // 初始宽度
          height: 800, // 初始高度
          show: false, // 可选：先隐藏窗口
        });
        await window.loadURL(url);
        const page = await pie.getPage(browser, window);

        // 2. 双重保障清除cookies
        try {
          console.error("CDP清除cookies");
          const client = await page.target().createCDPSession();
          await client.send("Network.clearBrowserCookies");
        } catch (e) {
          console.error("CDP清除cookies失败:", e);
          const cookies = await page.cookies();
          for (const cookie of cookies) {
            await page.deleteCookie(cookie);
          }
        }

        await page.setRequestInterception(true);

        page.on("request", (interceptedRequest) => {
          if (
            interceptedRequest
              .url()
              .includes("/starlink-api/daily/main/toDoTodayList")
          ) {
            const timestamp = new Date(
              `${formattedDate}T00:00:00+08:00`
            ).getTime();
            console.log(`${formattedDate} 对应时间戳：`, timestamp);
            const newPostData = JSON.stringify({
              ...JSON.parse(interceptedRequest.postData() || "{}"),
              cycleTime: formattedDate,
              queryTime: timestamp,
            });
            console.log(newPostData, '/starlink-api/daily/main/saveSubmit"');
            interceptedRequest.continue({
              postData: newPostData,
              headers: {
                ...interceptedRequest.headers(),
                "Content-Type": "application/json",
              },
            });
          } else if (
            interceptedRequest
              .url()
              .includes("/starlink-api/daily/main/saveSubmit")
          ) {
            const newPostData = JSON.stringify({
              ...JSON.parse(interceptedRequest.postData() || "{}"),
              submitTime: formattedDate,
            });
            console.log(newPostData, '/starlink-api/daily/main/saveSubmit"');

            const targetDateTime = `${formattedDate}T14:30:00+08:00`; // 北京时间
            const customDate = new Date(targetDateTime);
            const dateHeader = customDate.toUTCString();
            console.log("生成的时间头:", dateHeader);

            interceptedRequest.continue({
              postData: newPostData,
              headers: {
                ...interceptedRequest.headers(),
                "Content-Type": "application/json",
                Date: dateHeader,
              },
            });
          } else {
            interceptedRequest.continue();
          }
        });

        page.on("response", async (response) => {
          if (
            response.url().includes("/starlink-api/daily/main/toDoTodayList")
          ) {
            // 替换为真实接口
            console.log("待提交===响应状态:", response.status());
            const body = await response.text();
            console.log("待提交===接口响应:", body);
            const responseData = JSON.parse(body);
            var res = responseData.data;
            var submitters = res.list;
            // console.log("今日代办数量：", submitters.length);
            sendMessage(event, `今日代办数量: ${submitters.length}`);

            const filteredList = submitters.filter((item) => item.status === 0);
            // console.log("未提交数量", filteredList.length);
            sendMessage(event, `未提交数量: ${filteredList.length}`);

            if (filteredList.length > 0) {
              const element = filteredList[0];
              //   console.log("当前提交的id:", element.id);
              sendMessage(event, `当前提交的id: ${element.id}`);
              var checkDay = await checktoDayInfo(
                element.id,
                browser,
                page,
                event,
                dayconfig
              );

              if (checkDay) {
                sendMessage(event, "进行检查今日代办是否需要提交日报");
                //进入今日代办页面
                await page.goto(
                  `https://ssc${dayconfig.env}.homedo.com/tabPage/appStore?menuId1=43&menuId2=117`
                );
              } else {
                sendMessage(event, "结束。。。");
              }
            } else {
              //   console.log("没有需要提交的日报");
              sendMessage(event, "没有需要提交的日报");
            }
          }
          if (response.url().includes("/starlink-api/daily/main/saveSubmit")) {
            // 替换为真实接口
            console.log("提交===响应状态:", response.status());
            const body = await response.text();
            console.log("提交===接口响应:", body);
          }
        });

        // const cookies = await page.cookies();
        await page.goto(url);
        // console.log("开始登录");
        sendMessage(event, "开始登录");

        await page.waitForSelector('input[name="mobile"]');
        const uniqueIdElement = await page.$('input[name="mobile"]');
        await uniqueIdElement.type(dayconfig.mobile, { delay: 30 });

        await page.waitForSelector('input[name="password"]');
        const $username = await page.$('input[name="password"]');
        await $username.type(dayconfig.password, {
          delay: 30,
        });

        await page.click(".loginItem .loginBtn");

        await new Promise((resolve) =>
          setTimeout(resolve, getRandomMilliseconds())
        );

        // 等待页面加载完成
        await page.waitForSelector(".pageSide .sideMenu .menuUl .menuLi", {
          visible: true,
          timeout: 10000,
        });

        sendMessage(event, "登录成功，跳转中。。。");

        sendMessage(event, `检查今日(${formattedDate})的代办。。。`);
        //进入今日代办页面
        await page.goto(
          `https://ssc${dayconfig.env}.homedo.com/tabPage/appStore?menuId1=43&menuId2=117`
        );
      } catch (error) {
        event.sender.send("dayWork-progress", {
          status: error.message,
        });
        throw error;
      } finally {
      }
    }
  );
}
async function checktoDayInfo(taskId, browser, page, event, dayconfig) {
  //进入写日报页面
  await page.goto(
    `https://ssc${dayconfig.env}.homedo.com/tabPage/appStore?menuId1=43&menuId2=109&taskId=${taskId}`
  );
  //判断页面弹窗属性
  await page.waitForSelector(".dialog-mask.leftCls");

  await new Promise((resolve) => setTimeout(resolve, getRandomMilliseconds()));

  var show = await isElementVisible(page, ".dialog-mask.leftCls");

  await page.waitForSelector(".n-form-item:nth-child(1) .n-input__input-el");
  const name = await page.$eval(
    ".n-form-item:nth-child(1) .n-input__input-el",
    (el) => el.value
  );

  await new Promise((resolve) => setTimeout(resolve, getRandomMilliseconds()));

  if (show) {
    await page.waitForSelector("div.dialog-box", { timeout: 5000 });
    await new Promise((resolve) =>
      setTimeout(resolve, getRandomMilliseconds())
    );
    // console.log("已经提交了日报");
    sendMessage(event, "已经提交了日报,不需重复提交");

    return false;
    //退出
  } else {
    await submitInfo(page, dayconfig);

    if (!dayconfig.saveSubmit) {
      console.log("点击提交日报");
      sendMessage(event, "点击提交日报");
      //   await page.click(".w80 > .n-button__content"); //点击提交

      await new Promise((resolve) =>
        setTimeout(resolve, getRandomMilliseconds(5000, 6000))
      );
      return true;
    } else {
      await page.click(".n-button--ghost > .n-button__content"); //点击保存
      console.log("点击保存,不要忘记提交");
      sendMessage(event, "点击保存,不要忘记提交");
      return false;
    }
  }
}

async function submitInfo(page, dayconfig) {
  var classStr =
    ".n-input.n-input--textarea .n-input__textarea-el, .n-input.n-input--textarea .n-input__textarea-mirror, .n-input.n-input--textarea .n-input__placeholder textarea";
  await page.waitForSelector(classStr);

  const textareaArray = await page.$$(classStr);
  var textareas = dayconfig.textareas;
  var textareaNames = {
    textarea1: "谁比你努力",
    textarea2: "工作内容",
    textarea3: "民主生活会",
    textarea4: "需要配合的",
    textarea5: "明日计划",
    textarea6: "反省两点",
    textarea7: "每天快乐",
    textarea8: "利他事情",
  };
  var dayworks = dayconfig.modelFormData;
  for (const textarea of textareas) {
    const textareaStr = shuffleArray(
      textarea.list,
      textarea.num,
      textarea.num > 1 ? true : false
    );
    dayworks[textarea.name] = textareaStr;
  }

  for (let index = 0; index < textareaArray.length; index++) {
    if (index % 2 == 0) {
      var inputIndex = index / 2 + 1;
      var textareaStr = "textarea" + inputIndex;
      var inputInfo = dayworks[textareaStr];

      if (allEvent) {
        allEvent.sender.send("dayWork-progress", {
          status: "开始设置 " + textareaNames[textareaStr],
        });
        allEvent.sender.send("dayWork-progress", {
          status: inputInfo,
        });
      }

      const targetElement = textareaArray[index];
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待1秒
      await targetElement.click({ clickCount: 3 });
      await targetElement.type("");
      const inputValue = await targetElement.getProperty("value");
      const inputContent = await inputValue.jsonValue();
      for (let index = 0; index < inputContent.length; index++) {
        await targetElement.click({ clickCount: 3 });
        await page.keyboard.press("Backspace");
      }
      await targetElement.type(inputInfo, {
        delay: 30,
      });
    }
  }
}

async function isElementVisible(page, selector) {
  try {
    const element = await page.$(selector);
    if (!element) {
      console.log(`Element with selector ${selector} not found.`);
      return false;
    }

    const style = await element.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      return {
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        opacity: computedStyle.opacity,
      };
    });
    const isVisible =
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0";
    return isVisible;
  } catch (error) {
    return false;
  }
}

function shuffleArray(infoArray, limit, needNum = true) {
  // const limit = 10; // 您希望生成的随机整数个数
  const min = 0;
  const max = infoArray.length - 1; // 随机整数的取值范围
  const limitNo = Math.min(limit, max); // 防止数据数量超过数组长度

  // 创建包含所有可能整数的数组
  let allNumbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  // 使用Fisher-Yates算法打乱数组顺序
  for (let i = allNumbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allNumbers[i], allNumbers[j]] = [allNumbers[j], allNumbers[i]];
  }
  // 截取前limit个元素作为随机且不重复的整数
  let uniqueRandoms = allNumbers.slice(0, limitNo);
  var infoStr = "";
  for (let index = 0; index < uniqueRandoms.length; index++) {
    const element = uniqueRandoms[index];
    if (infoArray[element] != undefined) {
      var numberStr = needNum ? index + 1 + "." : "";
      infoStr += "" + numberStr + infoArray[element] + "\n";
    } else {
      // console.error(`Element at index ${element} is undefined`);
    }
  }
  return infoStr;
}
function getRandomMilliseconds(min = 1000, max = 5000) {
  if (min < 0 || max < 0) {
    throw new Error("最小值和最大值必须是非负整数");
  }
  if (min > max) {
    throw new Error("最小值不能大于最大值");
  }
  console.log(`随机等待时间: ${min} - ${max}毫秒`);
  if (allEvent) {
    allEvent.sender.send("dayWork-progress", {
      status: `随机等待时间: ${min} - ${max}毫秒`,
    });
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sendMessage(event, message) {
  event.sender.send("dayWork-progress", {
    status: message,
  });
}

module.exports = {
  runPuppeteerWithElectronChromiumDayWork,
};
