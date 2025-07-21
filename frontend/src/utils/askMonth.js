import axios from "axios";

var gxhusertoken = "";
const BASE_URL = "https://ssc.homedo.com";
// 认证配置
const API_CONFIG = {
  loginUrl: BASE_URL + "/starlink-api/user/login", //登录
  queryMyExamList: BASE_URL + "/starlink-api/aipu/study_center/queryMyExamList", //获取状态
  queryExamPaper: BASE_URL + "/starlink-api/aipu/study_center/queryExamPaper", //获取信息
  submitExam: BASE_URL + "/starlink-api/aipu/study_center/submitExam", //提交
};

async function loginGxh(account) {
  try {
    let data = JSON.stringify({
      account: account,
      password: "",
      origin: "code",
      code: "526398",
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
    console.log(response, "loginGxhresponse");
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

async function queryMyExamListInfo(gxhusertoken) {
  //获取状态
  try {
    let config = {
      method: "post",
      url: `${API_CONFIG.queryMyExamList}`,
      headers: getHeaders(gxhusertoken),
      data: { page: 1, size: 100 },
    };
    const response = await axios.request(config);
    console.log(response, "queryMyExamListInforesponse");
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

async function queryExamPaperInfo(gxhusertoken, examId, classId) {
  try {
    let data = JSON.stringify({});
    let config = {
      method: "get",
      url: `${API_CONFIG.queryExamPaper}?examId=${examId}&classId=${classId}`,
      headers: getHeaders(gxhusertoken),
      data: data,
    };
    const response = await axios.request(config);
    console.log(response, "queryExamPaperInforesponse");
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

async function submitExamInfo(gxhusertoken, submitData) {
  try {
    let data = JSON.stringify(submitData);
    let config = {
      method: "get",
      url: `${API_CONFIG.submitExam}`,
      headers: getHeaders(gxhusertoken),
      data: data,
    };
    const response = await axios.request(config);
    console.log(response, "submitExamInforesponse");
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

export { loginGxh, queryExamPaperInfo, submitExamInfo, queryMyExamListInfo };
