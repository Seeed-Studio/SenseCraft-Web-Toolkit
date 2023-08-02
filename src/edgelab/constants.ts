export const PROTOCOL_LIST = [
  {
    value: 'webusb',
    label: 'WebUSB',
  },
  {
    value: 'serial',
    label: 'Serial',
  },
];

export const DEFAULT_PROTOCOL = localStorage.getItem('protocol') || 'webusb';
