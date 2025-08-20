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


`

export {
  dayWorkData,
  };