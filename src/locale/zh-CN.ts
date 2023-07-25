import localeWorkplace from '@/views/dashboard/workplace/locale/zh-CN';
import localeDeviceConfig from '@/api/atclient/locale/zh-CN';
import localeSettings from './zh-CN/settings';

export default {
  'menu.dashboard': '仪表盘',
  'menu.data': '数据采集',
  'menu.data.vision': '视觉',
  'menu.data.sensor': '传感器',
  'menu.data.audio': '音频',
  'menu.model': '模型',
  'menu.model.train': '训练',
  'menu.deployment': '模型部署',
  'menu.deployment.deploy': '部署',
  'menu.deployment.convert': '转换',
  'menu.faq': '常见问题',
  'navbar.docs': '文档中心',
  'navbar.action.locale': '切换为中文',
  ...localeSettings,
  ...localeWorkplace,
  ...localeDeviceConfig,
};
