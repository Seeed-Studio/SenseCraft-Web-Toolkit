export const DeviceType = {
  XiaoEsp32s3: 'xiao_esp32s3',
  GroveAIWE2: 'we2',
};

export const DEVICE_LIST = [
  {
    id: DeviceType.XiaoEsp32s3,
    name: 'XIAO ESP32S3',
    filter: [{ vendorId: 0x303a, productId: 0x1001 }],
  },
  {
    id: DeviceType.GroveAIWE2,
    name: 'Grove Vision AI(V2)',
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
