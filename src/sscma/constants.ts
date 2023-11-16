export const DEVICE_LIST = [
  {
    name: 'XIAO ESP32S3',
    filter: [{ vendorId: 0x303a, productId: 0x1001 }],
  },
  {
    name: 'Vision AI (WE-II)',
    filter: [{ vendorId: 0x1a86, productId: 0x55d3 }],
  },
];

export const deviceTypeObj = DEVICE_LIST.reduce(
  (obj: Record<string, (typeof DEVICE_LIST)[0]>, e) => {
    obj[e.name] = e;
    return obj;
  },
  {}
);
