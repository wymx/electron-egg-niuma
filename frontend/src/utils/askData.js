const askData = `# ------注意缩进格式-------
# 是否为测试 true:测试 false:正式
submitTest: true

# 处理回复内容随机取一个
answer: 
  - "收到"
  - "好的，收到"

# 不回复谁的清单
answerUsers: 
  - ""

# 自动回提处理的清单
# true:自动回提 false:不回提
autoReply: false

# 不自动回提谁的清单(给自己加上)
# 建议设置为上级领导和重名的同事
# 要把自己的设置进去，防止反复回提
notAutoReplyUsers: 
  - "王伟"

# 自动回提设置区域
# 提出人区域：NC:南昌分公司,CQ:忠县分公司,FY:阜阳分公司,HF:合肥分公司,ZB:上海总部/含集团河姆渡集光,各战区/各分支
area: "FY"

# 自己发的清单已回复的进行评分
# 是否进行评分：true:评分(满意) false:不评分
# 评分为满意，不评分则不处理
score: true

# 处理条数：0:全部处理 其他数值:处理指定条数
dealNum: 0

# 处理时间间隔(分钟)
refTime: 0.3

`

export {
  askData,
  };