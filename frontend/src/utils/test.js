// ==UserScript==
// @name         🥇【好医生小助手】无人值守|自动静音|视频助手|考试助手|解禁调试
// @namespace    http://tampermonkey.net/
// @version      1.0.6
// @description  ❌倍速播放✅屏蔽广告✅解禁调试✅视频助手✅考试助手(遍历试错)✅双模选择：只看不考、全看遂考🚑如果你想对脚本表示肯定或意见，可以通过赞赏码备注；如果要与我反复交流，则需移步到下载本脚本的页面，在"反馈"区留下意见或直接私信我。
// @author       境界程序员
// @license      AGPL License
// @match        https://www.cmechina.net/cme/*
// @match        https://www.cmechina.net/cme/exam.jsp*
// @match        https://www.cmechina.net/cme/examQuizFail*
// @match        https://www.cmechina.net/cme/examQuizPass*
// @match        https://www.cmechina.net/cme/course.jsp?course_id*
// @match        https://www.cmechina.net/pub/tongzhi.jsp*
// @match        https://www.cmechina.net/webcam/ewmface2.jsp*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// @grant        unsafeWindow
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @antifeature  Donate听说含捐赠功能需要添加此代码（无任何作用）
// ==/UserScript==

var newupdate =
  "2024.9.19屏蔽签到。也许有人好奇怎么没更新了，在忙工作忙论文……(꒦_꒦) )自动考试功能暂时取消";

(function () {
  "use strict";

  // 引入jQuery
  var script = document.createElement("script");
  script.src =
    "https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js";
  script.onload = function () {
    // jQuery加载完成后执行的代码
    console.log("jQuery已加载");
    // 在这里写你的jQuery代码
    $("body").append("<p>Hello, jQuery!</p>");
  };
  document.head.appendChild(script);

  var url = window.location.href;
  advis(); //广告和操作平台
  if (
    url.indexOf("https://www.cmechina.net/cme/polyv") != -1 ||
    url.indexOf("https://www.cmechina.net/cme/study2.jsp") != -1
  ) {
    console.log("进入好医生课程");

    $(window).on("load", function () {
      // 移除右键菜单禁用
      $(document).on("contextmenu", null);

      // 移除F12禁用
      $(document).off("keydown keyup keypress");
      var infoold = console.info; //保存以前的console.info以防万一
      console.info = function () {}; //禁止提示错误信息
      console.clear = function () {}; //禁止清空控制台

      var kecheng;
      try {
        kecheng = $("ul[id='s_r_ml']").find("li");
      } catch (e) {
        kecheng = $("ul[id='s_r_ml']").find("li");
      }

      var i = 0;
      while (i < kecheng.length) {
        if (
          kecheng.eq(i).text().includes("未学习") == true &&
          !kecheng.eq(i).hasClass("active")
        ) {
          console.log(kecheng.eq(i).text().replace("未学习", ""));
          window.s2j_onPlayerInitOver = function () {
            //PV视频加载完毕
            setTimeout(function () {
              try {
                //$("video").prop("muted", true);
                cc_js_Player.play();
                cc_js_Player.setVolume(0);
                console.log("运行了这个事件");
              } catch (error) {
                $("video").get(0).play(); //传统意义找播放器播放视频
                $("video").prop("muted", true);
              }
            }, 1000); //延迟1秒操作，为网页留点时间
          };

          setTimeout(function () {
            setInterval(function () {
              counttime();
            }, 10000);
            kecheng.eq(i).find("a").click(); //点击第一个没有播放的视频
          }, 4000); //延迟4秒，避免网页还没打开
          break;
        } else if (
          kecheng.eq(i).text().includes("未学习") == true &&
          kecheng.eq(i).hasClass("active")
        ) {
          console.log(kecheng.eq(i).text().replace("未学习", ""));
          //$("video[class='pv-video']").get(0).play();//播放视频
          //$("video").get(0).play();//播放视频
          cc_js_Player.play();
          setTimeout(function () {
            cc_js_Player.setVolume(0);
            // $("video").prop("muted", true);
            // $("video").prop("volume", 0);
          }, 300);
          setInterval(function () {
            counttime();
          }, 10000);
          break;
        }
        //clearInterval(intervalid);
        if (i == kecheng.length - 1) {
          if (localStorage.getItem("mode") == "2") {
            setTimeout(function () {
              $("a[class='cur']").click();
            }, 2000);
          } else {
            alert("已经完成全部学习，请自行考试");
          }
        }
        i++;
      }

      function counttime() {
        clearInterval(intervalPause); //第一招：去掉签到定时器
        pauseSecond = -1; //第二招：去掉签到定时器
        function openPause() {} //第三招：清空弹出签到的功能
        var currenttime = parseInt(cc_js_Player.getPosition());
        var duration = parseInt(cc_js_Player.getDuration());
        var percent = ((currenttime / duration) * 100).toFixed(2) + "%";
        if (currenttime == duration) {
          console.log("已播放" + percent);
          location.reload();
        } else {
          console.log("已播放" + percent);
          cc_js_Player.play();
          cc_js_Player.setVolume(0);
          document.title =
            "【" + percent + "】" + $("a[class='active']").text();
          // $("video").get(0).play();//播放视频
          // $("video").prop("muted", true);
          // $("video").prop("volume", 0);
        }
      }
    });
  } else if (
    url.indexOf("https://www.cmechina.net/cme/exam.jsp不允许考试") != -1
  ) {
    //这里是考试页面
    var timu = $("li"); //获取全部考题和选项
    var cishu = localStorage.getItem("cishu");
    var answer = localStorage.getItem("Answer");
    console.log("提取的答案" + answer);
    console.log("次数：" + cishu);

    var i = 0; //用于遍历题号
    var j = 0; //用于遍历选项

    while (i < timu.length) {
      if (answer === null) {
        if (timu.eq(i).text().indexOf("多选") != -1) {
          //如果是多选题，则全选（虽然不完美）
          timu
            .eq(i)
            .find("input[type='checkbox']")
            .each(function () {
              $(this).prop("checked", true);
            });
        } else {
          timu.eq(i).find("input[type='radio']").eq(0).click(); //如果是空的，那么全部选A
          localStorage.setItem("cishu", 1); //恢复第一次作答
        }
      } else {
        answer = answer.toString().split(",");
        if (timu.eq(i).text().indexOf("多选") != -1) {
          //如果是多选题，则全选（虽然不完美）
          timu
            .eq(i)
            .find("input[type='checkbox']")
            .each(function () {
              $(this).prop("checked", true);
            });
        } else {
          try {
            timu.eq(i).find("input[type='radio']").eq(thxx(answer[j])).click(); //如果不是多选
          } catch (error) {
            timu.eq(i).find("input[type='radio']").eq(0).click(); //如果答案没有E，会出现错误，错误的话重新选A
          }
        }
        localStorage.setItem("cishu", parseInt(cishu) + 1); //恢复第一次作答
      }
      i++;
      j++;
      if (cishu > 5) {
        cleanKeyStorage(); //次数大于说明题目乱了，要重新从A开始选择
        localStorage.setItem("cishu", 1); //恢复第一次作答
      }
    }

    setTimeout(function () {
      $("a[id='tjkj']").click(); //提交答案按钮
    }, 500);
  } else if (
    url.indexOf("https://www.cmechina.net/cme/examQuizFail不允许考试") != -1
  ) {
    //答题失败了

    const extractedList = url.match(/error_order=([0-9,]+)/)[1].split(","); //错题列表
    console.log("错题题号" + extractedList); // 输出: ["1", "2", "4", "5"]
    const ansList = url.match(/ansList=([^&]+)/)[1].split(","); //答案列表
    console.log("原本的答案" + ansList); //输出["A","B","C","D","E"]全部题目答案
    var i = 0;
    while (i < extractedList.length) {
      ansList[parseInt(extractedList[i]) - 1] = fthxx(
        parseInt(thxx(ansList[parseInt(extractedList[i]) - 1])) + 1
      ); //将错题A转换为数字1，代表待会儿选B
      i++;
    }
    localStorage.setItem("Answer", ansList); //存储答案
    console.log("存储的答案" + ansList);

    setTimeout(function () {
      $("a[id='cxdt']").click(); //重新答题
    }, 500);
  } else if (url.indexOf("https://www.cmechina.net/cme/examQuizPass") != -1) {
    //答题成功
    cleanKeyStorage();
    setTimeout(function () {
      $("div[class='show_exam_btns']").find("a").click(); //调到下一个章节的考试
    }, 2000);
  } else if (
    url.indexOf("https://www.cmechina.net/cme/course.jsp?course_id") != -1
  ) {
    try {
      $("i[class='fa fa-circle-o']").click(); //课程页面点击未学习的进入
    } catch (error) {
      if (localStorage.getItem("mode") == "2") {
        $("i[class='fa fa-adjust']").click(); //课程页面点击要考试的进入
      }
    }
  } else if (url.indexOf("https://www.cmechina.net/pub/tongzhi.jsp") != -1) {
    //网站的广告通知，直接给他点掉。
    setTimeout(function () {
      try {
        $("a[class='newBtn']").click();
      } catch (error) {
        console.log("没有找到推广通知");
      }
    }, 1000);
  } else if (url.indexOf("https://www.cmechina.net/cme/index.jsp") != -1) {
    setTimeout(function () {
      try {
        $("div[class='close2']").click();
      } catch (error) {
        console.log("没有找到首页广告");
      }
    }, 1000);
  } else if (
    url.indexOf("https://www.cmechina.net/webcam/ewmface2.jsp") != -1
  ) {
    console.log("二维码页面");
    var code = setInterval(function () {
      $("div[id='wx_pay_ewm']").find("canvas").css({
        position: "relative",
        left: "-60px",
        top: "-100px",
        height: "300px",
        width: "300px",
      });
      if ($("div[id='wx_pay_ewm']").find("canvas").css("height") == "300px") {
        clearInterval(code);
      }
    }, 100);
    setTimeout(function () {
      var nihao = $("<div>").text("二维码已失效，点此刷新");
      nihao.css({
        position: "relative",
        top: "-270px",
        left: "-35px",
        width: "250px",
        "font-size": "22px",
        "text-align": "left",
        color: "#ff0000",
        "font-weight": "bold",
        "background-color": "#FFFFFF",
      });
      $("div[id='wx_pay_ewm']").find("canvas").parent().append(nihao);
      nihao.on("click", function () {
        location.reload();
      });
    }, 60000);
  }

  //---------------------------------全局函数区------------------------------//

  function thxx(xx) {
    switch (xx) {
      case "A":
        xx = 0;
        break;
      case "B":
        xx = 1;
        break;
      case "C":
        xx = 2;
        break;
      case "D":
        xx = 3;
        break;
      case "E":
        xx = 4;
        break;
    }
    return xx;
  }

  function fthxx(xx) {
    switch (xx) {
      case 0:
        xx = "A";
        break;
      case 1:
        xx = "B";
        break;
      case 2:
        xx = "C";
        break;
      case 3:
        xx = "D";
        break;
      case 4:
        xx = "E";
        break;
    }
    return xx;
  }

  function cleanKeyStorage() {
    //缓存清理
    localStorage.removeItem("cishu");
    localStorage.removeItem("Answer");
  }

  function advis() {
    var div1 = $("<div>").html(
      `
    <div id='Div1' style="max-width:220px;text-align:left;padding: 10px 10px;font-size: 20px;float: left;position:fixed;top:180px;left: 10px;z-index: 99999; background-color: rgba(184, 247, 255, 0.7); overflow-x: auto;">
    <span id='clo' style="float: right;position: absolute;top:14px;right:5px;cursor:pointer;font-size:16px">❎</span>
    <div style="font-size:22px;font-weight:bold;color:red;">好医生小助手` +
        GM_info.script.version +
        `</div> 
    <hr style="margin-top: 10px;margin-bottom: 10px;">
    <a id='Autocourse' class="btn btn-default">★只看不考</a><br>
    <a id='Joincourse' class="btn btn-default">★全看遂考</a><br><br>
    
    <span style="font-size:18px;font-weight:bold;color:black;">其他脚本</span><br>
    <a id='Share1' class="btn btn-default" style="font-size:16px;font-weight:bold;color:red;">👉&nbsp华医网小助手</a><br>
    <a id='Share2' class="btn btn-default" style="font-size:16px;font-weight:bold;color:red;">👉&nbsp成都继教医学教育平台</a><br>
    <a class='spe' style="font-size:16px;font-weight:normal;color:black;white-space:pre-wrap;">😁</a>
    <a id='update' class='spe' style="font-size:14px;font-weight:normal;color:black;white-space:pre-wrap;">最近更新:<br>` +
        newupdate +
        `</a><br>
    </div>`
    );

    var div2 = $("<div>").html(`
    <div id='Div2' style = "padding: 10px 10px;font-size: 20px;float: left;position:fixed;top:180px;left: 240px;z-index: 99999; background-color: rgba(184, 247, 255, 0.7); overflow-x: auto;" >
    <img id="Pic" style = "width:auto;height:200px;object-fit: contain;" src='';>
    </div> `);
    //<input type="text" id="token" style="width: 130px;" value="`+ GM_getValue("tikutoken") + `"></input>
    // <a id='Getlicense' class="btn btn-default">★获取授权</a>
    // 使用jQuery追加到body（正确方式）
    $("body").append(div1, div2);
    // document.getElementById("Pic").style.height = document.querySelector("div[id='Div1']").offsetHeight - 20 + "px"; //因为虚化上下各10px
    $("#Pic").height($('div[id="Div1"]').outerHeight() - 20);

    // 使用jQuery选择器获取元素
    const $mode1 = $("#Autocourse");
    const $mode2 = $("#Joincourse");
    const $share1 = $("#Share1");
    const $share2 = $("#Share2");
    const $clo = $("#clo"); // 新增关闭按钮选择器

    // 使用jQuery的html()方法替代innerHTML
    if (!localStorage.getItem("mode") || localStorage.getItem("mode") === "1") {
      $mode1.html("★只看不考 ✅");
      $mode2.html("★全看遂考");
    } else {
      $mode2.html("★全看遂考 ✅");
      $mode1.html("★只看不考");
    }

    // 使用jQuery绑定事件
    $mode1.on("click", function () {
      $(this).html("★只看不考 ✅");
      $mode2.html("★全看遂考");
      localStorage.setItem("mode", "1");
    });

    $mode2.on("click", function () {
      $(this).html("★全看遂考 ✅");
      $mode1.html("★只看不考");
      localStorage.setItem("mode", "2");
    });

    // 使用jQuery统一绑定所有事件
    $share1.on("click", function () {
      window.open("https://greasyfork.org/zh-CN/scripts/483418", "_blank");
    });

    $share2.on("click", function () {
      window.open("https://greasyfork.org/zh-CN/scripts/494635", "_blank");
    });

    $clo.on("click", function () {
      $("#Div1, #Div2").hide(); // 使用jQuery选择器隐藏元素
    });
  }
})();
