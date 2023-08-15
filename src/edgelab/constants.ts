export const PROTOCOL_LIST = [
  {
    value: 'serial',
    label: 'Serial',
  },
  {
    value: 'webusb',
    label: 'WebUSB',
  },
];

export const DEFAULT_PROTOCOL = localStorage.getItem('protocol') || 'webusb';
