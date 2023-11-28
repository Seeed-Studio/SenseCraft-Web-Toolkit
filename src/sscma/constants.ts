export const DeviceType = {
  XiaoEsp32s3: 'xiao_esp32s3',
  VisionAIWeII: 'we_ii',
};

export const DEVICE_LIST = [
  {
    id: DeviceType.XiaoEsp32s3,
    name: 'XIAO ESP32S3',
    filter: [{ vendorId: 0x303a, productId: 0x1001 }],
  },
  {
    id: DeviceType.VisionAIWeII,
    name: 'Vision AI (WE-II)',
    filter: [{ vendorId: 0x1a86, productId: 0x55d3 }],
  },
];

export const deviceTypeObj = DEVICE_LIST.reduce(
  (obj: Record<string, (typeof DEVICE_LIST)[0]>, e) => {
    obj[e.id] = { ...e };
    return obj;
  },
  {}
);
