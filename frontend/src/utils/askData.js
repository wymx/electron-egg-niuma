const askData = `# ------注意缩进格式-------
# 是否为测试 true:测试 false:正式
submitTest: true

# 处理回复内容随机取一个
answer: 
  - "收到"
  - "好的，收到"

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