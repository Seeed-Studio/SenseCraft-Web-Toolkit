import localeProcess from './zh-CN/process';
import localeSettings from './zh-CN/setup';

export default {
  'menu.setup': '设置',
  'menu.setup.process': '工作台',
  'menu.setup.config': '配置',
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
  'navbar.swap.confirm.text':
    '当处于连接状态下切换会导致当前连接断开，确定切换嘛？',
  'navbar.switch': '切换',
  'confirm': '确定',
  'cancel': '取消',
  'config.save.success': '保存成功',
  ...localeSettings,
  ...localeProcess,
};
