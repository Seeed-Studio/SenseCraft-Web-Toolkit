import localeProcess from './zh-CN/process';
import localeSettings from './zh-CN/setup';

export default {
  'menu.setup': '设置',
  'menu.setup.process': '工作台',
  'menu.setup.output': '输出',
  'menu.tool': '工具',
  'menu.data': '数据采集',
  'menu.data.vision': '视觉',
  'menu.data.sensor': '传感器',
  'menu.data.audio': '音频',
  'menu.model': '模型',
  'menu.model.train': '训练',
  'menu.deployment.deploy': '部署',
  'menu.deployment.convert': '转换',
  'menu.faq': '常见问题',
  'navbar.docs': '文档中心',
  'navbar.action.locale': '切换为中文',
  'confirm': '确定',
  'cancel': '取消',
  ...localeSettings,
  ...localeProcess,
};
