import localeProcess from './en-US/process';
import localeSettings from './en-US/setup';

export default {
  'menu.setup': 'Setup',
  'menu.setup.process': 'Process',
  'menu.setup.output': 'Output',
  'menu.tool': 'Tool',
  'menu.data': 'Data Acquisition',
  'menu.data.vision': 'Vision',
  'menu.data.sensor': 'Sensor',
  'menu.data.audio': 'Audio',
  'menu.model': 'Model',
  'menu.model.train': 'Train',
  'menu.deployment.deploy': 'Deploy',
  'menu.deployment.convert': 'Convert',
  'menu.faq': 'FAQ',
  'navbar.docs': 'Docs',
  'navbar.action.locale': 'Switch to English',
  'confirm': 'Confirm',
  'cancel': 'Cancel',
  ...localeSettings,
  ...localeProcess,
};
