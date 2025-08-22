import axios from "axios";

const dayWorkData = `# ------注意缩进格式-------
# 注意fat环境的密码要和上面输入框的一致否则不能登录成功
# 是否为测试 ".fat":测试 "":正式
env: ""

# 是否保存日报 
# false:发送，不保存 true:保存，不发送
saveSubmit: true 

# 不校验当前日期是否为周日和节假日
# true:不校验 false:校验 
notCheckDay: false

# 是否显示窗口
# true:显示 false:不显示
showWindow: false 

# 提交信息(这里不做改动，需要改动可以在textareas中配置)
modelFormData:
  name: "" # 姓名
  dateTime: "" # 时间
  department: "" # 部门
  textarea1: "无" # 谁比你努力
  textarea2: "无" # 工作内容
  textarea3: "无" # 民主生活会
  textarea4: "无" # 需要配合的
  textarea5: "无" # 明日计划
  textarea6: "无" # 反省两点
  textarea7: "无" # 每天快乐
  textarea8: "无" # 利他事情
  # assess: "1" # 今天比昨天好

# 提交内容数组,可配置1-8的textarea
# 如果不需要某个textarea可以不配置
# name: textarea1-8
# num: 从list中选择的个数
# list: 提供选择的内容
textareas:
  - name: "textarea1"
    num: 1
    list:
      - "xxx"
      - "xxx"


`;

var gxhusertoken = "";
const BASE_URL = "https://ssc.homedo.com";
// 认证配置
const API_CONFIG = {
  loginUrl: BASE_URL + "/starlink-api/user/login", //登录
  currentUser: BASE_URL + "/starlink-api/user/currentUser", //获取用户信息
  toDoTodayList: BASE_URL + "/starlink-api/daily/main/toDoTodayList", //今日代办
  getDeptNameFullPath: BASE_URL + "/starlink-api/user/getDeptNameFullPath", //fullPath
  writeDaily: BASE_URL + "/starlink-api/daily/main/writeDaily", //?id=748125
  getDraftByUser: BASE_URL + "/starlink-api/daily/main/getDraftByUser", //获取草稿
  updateDraft: BASE_URL + "/starlink-api/daily/main/updateDraft", //更新草稿
  saveSubmit: BASE_URL + "/starlink-api/daily/main/saveSubmit", //提交
};

async function loginGxh(account, isFat = false) {
  try {
    let data = JSON.stringify({
      account: account,
      password: "",
      origin: "code", //password
      code: isFat ? "006688" : "526398",
      timestamp: "",
      client_id: "admin",
      client_secret: "123456",
      scope: "all",
      grant_type: "password",
    });
    let config = {
      method: "post",
      url: `${API_CONFIG.loginUrl}?n=${Date.now()}`,
      headers: getHeaders(),
      data: data,
    };
    const response = await axios.request(config);
    // console.log(response, "loginGxhresponse");
    if (response.data.code == 2000) {
      gxhusertoken = response.data.data.token;
      return gxhusertoken;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
    return false;
  }
}
async function currentUser(gxhusertoken) {
  try {
    let config = {
      method: "get",
      url: `${API_CONFIG.currentUser}?n=${Date.now()}`,
      headers: getHeaders(gxhusertoken),
      data: {},
    };
    const response = await axios.request(config);
    // console.log(response, "currentUser");
    if (response.data.code == 2000) {
      return response.data.data.userInfo;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
    return false;
  }
}
async function getDeptNameFullPath(gxhusertoken) {
  try {
    let config = {
      method: "get",
      url: `${API_CONFIG.getDeptNameFullPath}`,
      headers: getHeaders(gxhusertoken),
    };
    const response = await axios.request(config);
    // console.log(response, "getDeptNameFullPath");
    if (response.data.code == 2000) {
      return response.data.data;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
    return false;
  }
}

async function toDoTodayList(gxhusertoken, dateTime) {
  //获取状态
  try {
    let config = {
      method: "post",
      url: `${API_CONFIG.toDoTodayList}`,
      headers: getHeaders(gxhusertoken),
      data: {
        name: "",
        ruleId: null,
        status: 0,
        template: null,
        type: null,
        queryTime: dateTime,
        page: 1,
        size: 12,
        cycleTime: dateTime,
      },
    };
    const response = await axios.request(config);
    // console.log(response, "toDoTodayListresponse");
    if (response.data.code == 2000) {
      return response.data.data;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
    return false;
  }
}

async function writeDaily(gxhusertoken, id) {
  try {
    let config = {
      method: "post",
      url: `${API_CONFIG.writeDaily}?id=${id}`,
      headers: {
        ...getHeaders(gxhusertoken),
      },
      data: {},
    };
    const response = await axios.request(config);
    // console.log(response, "writeDailyResponse");
    if (response.data.code == 2000) {
      return response.data.data;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
    return false;
  }
}

async function saveSubmit(gxhusertoken, submitData) {
  try {
    const targetDateTime = `${submitData.submitTime}T14:30:00+08:00`; // 北京时间
    const customDate = new Date(targetDateTime);
    const dateHeader = customDate.toUTCString();
    console.log("生成的时间头:", dateHeader);

    let config = {
      method: "post",
      url: `${API_CONFIG.saveSubmit}`,
      headers: {
        ...getHeaders(gxhusertoken),
        "Content-Type": "application/json;charset=UTF-8",
        Date: dateHeader,
      },
      data: submitData,
    };
    const response = await axios.request(config);
    console.log(response, "submitResponse");
    if (response.data.code == 2000) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
    return false;
  }
}
async function getDraftByUser(gxhusertoken) {
  try {
    let config = {
      method: "post",
      url: `${API_CONFIG.getDraftByUser}`,
      headers: {
        ...getHeaders(gxhusertoken),
      },
      data: {},
    };
    const response = await axios.request(config);
    console.log(response, "getDraftByUserResponse");
    if (response.data.code == 2000) {
      return response.data.data;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
    return false;
  }
}


async function updateDraft(gxhusertoken, submitData) {
  try {
    let config = {
      method: "post",
      url: `${API_CONFIG.updateDraft}`,
      headers: {
        ...getHeaders(gxhusertoken),
      },
      data: submitData,
    };
    const response = await axios.request(config);
    console.log(response, "updateDraftResponse");
    if (response.data.code == 2000) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
    return false;
  }
}

function getHeaders(tokens) {
  var headers = {
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
  if (!tokens) {
    return headers;
  } else {
    headers.authorization = `${tokens}`;
    return headers;
  }
}

export {
  dayWorkData,
  loginGxh,
  toDoTodayList,
  saveSubmit,
  getDraftByUser,
  updateDraft,
  getDeptNameFullPath,
  currentUser,
  writeDaily
};
