import localeWorkplace from '@/views/dashboard/workplace/locale/en-US';
import localeDeviceConfig from '@/api/atclient/locale/en-US';
import localeSettings from './en-US/settings';

export default {
  'menu.dashboard': 'Dashboard',
  'menu.server.dashboard': 'Dashboard-Server',
  'menu.server.workplace': 'Workplace-Server',
  'menu.server.monitor': 'Monitor-Server',
  'menu.data': 'Data Acquisition',
  'menu.data.vision': 'Vision',
  'menu.data.sensor': 'Sensor',
  'menu.data.audio': 'Audio',
  'menu.model': 'Model',
  'menu.model.train': 'Train',
  'menu.deployment': 'Deployment',
  'menu.deployment.deploy': 'Deploy',
  'menu.deployment.convert': 'Convert',
  'menu.faq': 'FAQ',
  'navbar.docs': 'Docs',
  'navbar.action.locale': 'Switch to English',
  ...localeSettings,
  ...localeWorkplace,
  ...localeDeviceConfig,
};
