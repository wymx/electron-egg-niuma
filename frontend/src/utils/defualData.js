const submitDefual = `# ------注意缩进格式-------

# 是否为测试 true:测试 false:正式
submitTest: true

# 账号密码,和顶部输入的账号密码选择一个就可以了
mobile: ""
password: ""

# 清单责任人和执行人，如果人名重复默认选中的是第一个(名字不能输错)
toUser: ""

# 清单数组(注意下面的格式，要和示例相同)
submitBody:
  - "发送的内容记得修改(多条时复制本行并修改内容，对齐保持格式相同)"

# 发送间隔时间分钟
refTime: 1

# 1:中心 2:自己 3:对领导 4:对下属 5:对内部
type: "5"

# 提出人区域：NC:南昌分公司,CQ:忠县分公司,FY:阜阳分公司,HF:合肥分公司,ZB:上海总部/含集团河姆渡集光,各战区/各分支
area: "FY"

# 紧急程度 A:重要且紧急 B:重要不紧急 C:不重要紧急
level: "C"

# 任务提出人所在中心
raise_user_centre: ""


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
  type: "5"
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

export {
  submitDefual
  };