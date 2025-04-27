const submitQingdan = `# ------注意缩进格式-------

# 是否为测试 true:测试 false:正式
submitTest: true

# 可选值：userSequence(顺序执行)/itemCross(交叉执行)
executeMode: "userSequence" 

# 责任人和执行人，如果人名重复默认选中的是第一个(名字不能输错)
# 使用多级数组当前示例是给一个人提交的示例
toUser:
  - "xxx"

# 清单数组(注意下面的格式，要和示例相同，缩进相同，当前示例为一维数组)
# - 要对齐，格式，格式，格式
submitBody:
  - 
    - "示例：要改掉"

# 0:会自动填写1或5 1:中心 2:自己 3:对领导 4:对下属 5:对内部
type: "0"

# 发送间隔时间分钟
refTime: 

# 提出人区域：NC:南昌分公司,CQ:忠县分公司,FY:阜阳分公司,HF:合肥分公司,ZB:上海总部/含集团河姆渡集光,各战区/各分支
area: ""

# 紧急程度 A:重要且紧急 B:重要不紧急 C:不重要紧急
level: ""

# 结束时间 0:当月最后一天 1:当前时间+1天 2:当前时间+2天 以此类推
finishTimeType: 0
# 提交时间随机增加分钟范围
finishTimeAutom: 1

# 提交数据
submitData:
  id: ""
  flowId: ""
  readStatus: "1"
  isxs: "1"
  nos: ""
  task_from: "0"
  raise_user_id: ""
  raise_user_name: ""
  # 提出人所在中心(会被上面的覆盖掉)
  raise_user_centre: ""
  # 1:中心 2:自己 3:对领导 4:对下属 5:对内部(会被上面的覆盖掉)
  type: "0"
  # 提出人区域(会被上面的覆盖掉)
  area: "FY"
  crmArea: ""
  # 紧急程度 A:重要且紧急 B:重要不紧急 C:不重要紧急(会被上面的覆盖掉)
  level: "C"
  # 使用上面的submitBody
  body: ""
  attach_url: []
  owner_user_id: ""
  owner_user_name: ""
  owner_user_centre: ""
  execute_user_id: []
  execute_user_name: ""
  # 完成时间(毫秒时间戳13位，https://www.jyshare.com/front-end/852/?utm_source=heifan)
  # 如果时间戳为0则自动获取当前月份的最后一天时间23:00:00.000的时间戳
  finish_time: 0
  beforeJudge: 2
  create_time: ""
  meeting_resolution_time: null
  status: 3
  jnpf_meeting_task_jnpf_is_satisfaction: "-1"
`

const submitRibao = `# ------注意缩进格式-------
# 提交保存按钮点击 true:提交 false:保存
submit: false
# 是否跳过节假日
chinaHoliday: true
# 指定跳过的日期
skipDate:
  - "2022-01-01"
# 提交信息
modelFormData:
  name: "" # 姓名
  dateTime: "" # 时间
  department: "" # 部门
  textarea1: "" # 谁比你努力
  textarea2: "" # 工作内容
  textarea3: "无" # 民主生活会
  textarea4: "无" # 需要配合的
  textarea5: "" # 明日计划
  textarea6: "无" # 反省两点
  textarea7: "无" # 每天快乐
  textarea8: "无" # 利他事情
  # assess: "1" # 今天比昨天好

# 提交内容数组
textareas:
  - name: "textarea1" # 谁比你努力
    num: 1            # 选中条数(不能超过数组长度)
    list:             # 待选数组
      - "张三"

  - name: "textarea2" # 工作内容
    num: 1            # 选中条数(不能超过数组长度)
    list:             # 待选数组  
      - "示例：跳转问题查看"

  - name: "textarea4" # 需要配合的
    num: 1            # 选中条数(不能超过数组长度)
    list:             # 待选数组
      - "示例：fat环境可以进行测试"
      
  - name: "textarea5" # 明日计划
    num: 1            # 选中条数(不能超过数组长度)
    list:             # 待选数组
      - "示例：测试问题调整"

  - name: "textarea6" # 反省两点
    num: 2            # 选中条数(不能超过数组长度)
    list:             # 待选数组
      - "修改的问题是否已经调整完成并提交测试"
      - "今天的工作安排是否都已完成"
      - "昨天是否有遗留问题需要继续更改"
`

export {
  submitQingdan,
  submitRibao
  };