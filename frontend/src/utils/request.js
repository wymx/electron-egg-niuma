import axios from "axios";
import { encrypt } from "./jsencrypt.js";
import { saveInfo } from "./sendNotify.js";

var usertoken = "";
var userInfo = null;
var inSubmit = false; //是否正在提交清单
// var codeParams = {
//   account: "13155391589",
//   password: false,
//   code: "1231",
//   origin: "official",
//   timestamp: 0,
//   jnpf_ticket: "",
//   grant_type: "official",
// };

// 认证配置
const API_CONFIG = {
  LOGIN_URL: "https://dida.homedo.com/api/oauth/Login",
  CURRENT_USER_URL: "https://dida.homedo.com/api/oauth/CurrentUser",
  USER_ONE_URL:
    "https://dida.homedo.com/api/permission/Users/ImUser/Selector/0",
  USER_INFO_URL: "https://dida.homedo.com/api/permission/Users",
  SUBMIT_URL:
    "https://dida.homedo.com/api/visualdev/OnlineDev/537986998195978437",
  PREVIEW_URL: "https://dida.homedo.com/api/system/DataInterface",
  BATCHPUSH_URL: "https://dida.homedo.com/api/usual/fiveInventory/batchPush",
};

async function loginUser(data) {
  try {
    var account = data.mobile;
    var password = encrypt(data.password) + "";
    const headers = {
      accept: "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      "cache-control": "no-cache",
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "jnpf-origin": "pc",
      pragma: "no-cache",
      priority: "u=1, i",
      // "sec-ch-ua": "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
      // "sec-ch-ua-mobile": "?0",
      // "sec-ch-ua-platform": "\"macOS\"",
      // "sec-fetch-dest": "empty",
      // "sec-fetch-mode": "cors",
      // "sec-fetch-site": "same-origin",
      "vue-version": "3",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    };

    const body = `account=${account}&password=${encodeURIComponent(
      password
    )}&code=&origin=bpm&timestamp=0&jnpf_ticket=&grant_type=bpm`;
    console.log(body, "loginUser body");

    const response = await axios.post(API_CONFIG.LOGIN_URL, body, { headers });
    var res = response.data;
    usertoken = res.token;
    console.log(response, "response");

    if (response.data.code == 200) {
      usertoken = response.data.data.token;
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
    return false;
  }
}

async function currentUserInfo() {
  try {
    const headers = getHeaders(usertoken);
    const response = await axios.get(API_CONFIG.CURRENT_USER_URL, { headers });
    var res = response.data;

    if (res.code == 200) {
      userInfo = res.data.userInfo;
      var allUserInfo = await getUserInfo(userInfo.userId, usertoken);
      userInfo = { ...userInfo, ...allUserInfo }
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
    return false;
  }
}

async function submitInfo(bodyInfo, qdconfig) {
  try {
    if (userInfo != null && usertoken != "" && !inSubmit) {
      inSubmit = true;
      var userId = userInfo.userId;

      var touserData = await getOneInfo(qdconfig.toUser, usertoken);
      // console.log(touserData, "touserData");
      if (touserData != null) {
        var toUserInfo = await getUserInfo(touserData.id, usertoken);

        const timestamp2 = new Date().getTime();

        qdconfig.submitData.nos = userId + "" + timestamp2;

        qdconfig.submitData.raise_user_centre = userInfo.centerName;
        qdconfig.submitData.raise_user_name = userInfo.userName;

        qdconfig.submitData.owner_user_id = toUserInfo.id;
        qdconfig.submitData.owner_user_name = toUserInfo.realName;
        qdconfig.submitData.owner_user_centre = toUserInfo.centerName;

        qdconfig.submitData.execute_user_id = [toUserInfo.id];
        qdconfig.submitData.execute_user_name = toUserInfo.realName;

        // 构造当月最后一天23点的时间戳
        const getMonthEndTimestamp = () => {
          const date = new Date();
          date.setMonth(date.getMonth() + 1, 0); // 设置为下个月的第0天（即本月最后一天）
          date.setHours(23, 0, 0, 0); // 设置时间为23:00:00.000
          return date.getTime();
        };
        var endTime =
          qdconfig.submitData.finish_time == 0
            ? getMonthEndTimestamp()
            : qdconfig.submitData.finish_time;

        qdconfig.submitData.finish_time = endTime;

        //设置对 0:会自动填写1或5 1:中心 2:自己 3:对领导 4:对下属 5:对内部
        if (qdconfig.type != "0") {
          //自动配置
          qdconfig.submitData.type = qdconfig.type;
        } else {
          console.log(
            userInfo.centerName,
            toUserInfo.centerName,
            "userData.centerName, toUserInfo.centerName"
          );

          if (userInfo.centerName == toUserInfo.centerName) {
            qdconfig.submitData.type = "5";
          } else {
            qdconfig.submitData.type = "1";
          }
        }

        //设置区域
        qdconfig.submitData.area = qdconfig.area;
        //设置紧急程度
        qdconfig.submitData.level = qdconfig.level;

        // 设置消息内容
        qdconfig.submitData.body = bodyInfo;

        var dataStr = JSON.stringify(qdconfig.submitData);
        var submitData = { id: "", data: dataStr };

        if (qdconfig.submitTest == true) {
          console.log("测试===提交信息", nowTimestr());
          console.log(qdconfig.submitData);
          saveInfo(qdconfig);
        } else {
          console.log("开始===提交信息", nowTimestr());
          // console.log(qdconfig.submitData);
          // 开始提交
          await submitUrl(submitData, usertoken, qdconfig.submitData.nos);
          saveInfo(qdconfig);
        }
      } else {
        console.log("没有找到touser用户信息");
      }
    } else {
      console.log("没有找到用户信息");
    }
  } catch (error) {
    console.error("提交失败:", error);
  } finally {
    inSubmit = false; // 确保 inSubmit 标志正确重置
  }
}

async function getOneInfo(keyword, tokens) {
  try {
    let data = JSON.stringify({
      keyword: keyword,
      currentPage: 1,
      pageSize: 20,
      status: 0,
    });
    let config = {
      method: "post",
      url: API_CONFIG.USER_ONE_URL,
      headers: getHeaders(tokens),
      data: data,
    };
    const response = await axios.request(config);
    let dataList = [];
    if (response.data.code == 200) {
      dataList = response.data.data.list;
    }
    return dataList.length > 0 ? dataList[0] : null;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // 返回 null 而不是空数组，以便在 main 函数中进行检查
  }
}

async function getUserInfo(id, tokens, parentIds = []) {
  try {
    const axiosConfig = {
      method: "get",
      url: `${API_CONFIG.USER_INFO_URL}/${id}?param=1`,
      headers: getHeaders(tokens),
      timeout: 15000,
    };
    const response = await axios.request(axiosConfig);
    // console.log(`Processing user info ${response.data.data}`);
    return response.data.data;
  } catch (error) {
    console.error(
      `Error fetching user info for id: ${id}, parentIds: ${parentIds.join(
        ", "
      )}`,
      error
    );
    return null;
  }
}

async function submitUrl(submitData, tokens, nos) {
  try {
    let datastr = JSON.stringify(submitData);
    let config = {
      method: "post",
      url: API_CONFIG.SUBMIT_URL,
      headers: getHeaders(tokens),
      data: datastr,
    };
    // console.log(config, "config");
    const response = await axios.request(config);
    console.log(response.data, "OnlineDev/response.data");
    await getDataList(nos, tokens);
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // 返回 null 而不是空数组，以便在 main 函数中进行检查
  }
}

async function getDataList(nos, tokens) {
  var listId = [
    "591849154481778501",
    "575009934601707397",
    "575191423075311493",
    "641598226767760197",
  ];

  for (let index = 0; index < listId.length; index++) {
    const element = listId[index];
    const responseData = await submitPreview(element, nos, tokens);
    if (responseData && responseData.length > 0) {
      console.log("Found data, stopping loop.", responseData);
      // {"code":200,"msg":"接口请求成功","data":[{"fId":83462,"taskId":148042}]}
      await batchPush(responseData[0].fId, responseData[0].taskId, tokens);
      // {"code":200,"msg":"Success"}
      break;
    }
  }
}

async function submitPreview(aid, nos, tokens) {
  try {
    let data = JSON.stringify({
      paramList: [
        {
          defaultValue: nos,
          fieldName: "fiveInventoryId",
          field: "fiveInventoryId",
        },
      ],
    });
    let config = {
      method: "post",
      url: `${API_CONFIG.PREVIEW_URL}/${aid}/Actions/Preview`,
      headers: getHeaders(tokens),
      data: data,
    };
    const response = await axios.request(config);
    console.log(response.data.data, `${aid}/Actions/Preview/response.data`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // 返回 null 而不是空数组，以便在 main 函数中进行检查
  }
}

async function batchPush(fiveInventoryId, taskId, tokens) {
  try {
    let data = {
      fiveInventoryList: [{ fiveInventoryId: fiveInventoryId, taskId: taskId }],
    };
    let config = {
      method: "post",
      url: API_CONFIG.BATCHPUSH_URL,
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
        authorization: `${tokens}`,
        "cache-control": "no-cache",
        "content-type": "application/json;charset=UTF-8",
        "jnpf-origin": "pc",
        pragma: "no-cache",
        "sec-ch-ua":
          '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "windows",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "vue-version": "3",
        Referer: "https://dida.homedo.com/model/wuxiangqingdan",
        "Access-Control-Allow-Origin": "*",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      data: data,
    };
    const response = await axios.request(config);
    console.log(response.data, "batchPush/response.data");
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // 返回 null 而不是空数组，以便在 main 函数中进行检查
  }
}

async function deletFromId(fiveInventoryId, tokens) {
  try {
    const url = `https://dida.homedo.com/api/visualdev/OnlineDev/537986998195978437/${fiveInventoryId}`;
    let data = JSON.stringify({});
    let config = {
      method: "delete",
      url: url,
      headers: getHeaders(tokens),
      data: data,
    };
    const response = await axios.request(config);
    console.log(response.data, "deleted/response.data");
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // 返回 null 而不是空数组，以便在 main 函数中进行检查
  }
}

function getHeaders(tokens) {
  return {
    authorization: `${tokens}`,
    "Content-Type": "application/json;charset=UTF-8",
    // Referer: "https://dida.homedo.com/model/wuxiangqingdan",
    // "User-Agent": "Java/1.8.0_281",
    "jnpf-origin": "pc",
    "cache-control": "no-cache",
    pragma: "no-cache",
    accept: "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
    // "sec-ch-ua":
    //   '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    // "sec-ch-ua-mobile": "?0",
    // "sec-ch-ua-platform": '"Windows"',
    // "sec-fetch-dest": "empty",
    // "sec-fetch-mode": "cors",
    // "sec-fetch-site": "same-origin",
    "vue-version": "3",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}

function nowTimestr() {
  const now = new Date();
  return now.toLocaleString();
}

// 处理消息使用本地ollama模型
async function useMessageOllama(msg, qdconfig) {
  try {
    const url = `http://localhost:11434/api/generate`;
    let data = JSON.stringify({
      model: "milkey/bilibili-index:latest",
      prompt: promptString(msg),
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 500,
      },
    });
    let config = {
      method: "POST",
      url: url,
      headers: {
        authorization: `Bearer ${qdconfig.aiKey}`,
        "Content-Type": "application/json;charset=UTF-8",
      },
      data: data,
    };
    const response = await axios.request(config);
    console.log(response.data, "useMessageOllama");
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // 返回 null 而不是空数组，以便在 main 函数中进行检查
  }
}

// 处理消息使用远程openai模型
async function useMessageAI(msg, qdconfig) {
  try {
    var reqUrl = qdconfig.apiUrl || "https://api.openai.com";
    const url = `${reqUrl}/v1/chat/completions`;
    let data = JSON.stringify({
      // model: "gpt-3.5-turbo-0125",//不行
      // model: "gpt-4o-mini-2024-07-18", //
      model: qdconfig.aiModel || "gpt-3.5-turbo", 
      messages: [
        {
          role: "user",
          content: promptString(msg),
        },
      ],
      stream: false,
    });
    let config = {
      method: "POST",
      url: url,
      headers: {
        authorization: `Bearer ${qdconfig.aiKey}`,
        "Content-Type": "application/json;charset=UTF-8",
      },
      data: data,
    };
    const response = await axios.request(config);
    console.log(response.data, "useMessageAI");
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // 返回 null 而不是空数组，以便在 main 函数中进行检查
  }
}

function promptString(msg) {
  return `你是一个内容优化专家，请仅对用户输入的原文内容进行专业加工，不是回答原文内容：
1. 内容增强要求：
   - 保持原文格式不变
   - 补充缺失的必要细节
   - 不是回答原文内容
   - 这个原文可能是寻求帮助的，或者是告知通知的性质，注意区分
   - 去除'相关人员','相关团队'字段

2. 禁止修改：
   - 原有的格式层级

输入原文：
${msg}

请输出优化后的内容（严格保持原格式）：`;
}

export {
  loginUser,
  currentUserInfo,
  submitInfo,
  getOneInfo,
  getUserInfo,
  getDataList,
  submitUrl,
  useMessageAI,
  useMessageOllama,
};
