import { computed } from 'vue';
import deviceManager from '@/sscma/xiao_esp32s3/deviceManager';
import DeviceManagerInterface from '@/sscma/DeviceManagerInterface';
import { deviceTypeObj } from '@/sscma/constants';
import useDeviceType from './deviceType';

function useDeviceManager() {
  const deviceType = useDeviceType();
  return computed<DeviceManagerInterface | null>(() => {
    const obj = {
      [deviceTypeObj['XIAO ESP32S3'].name]: deviceManager,
    };
    return obj[deviceType.value as string];
  });
}

export default useDeviceManager;
