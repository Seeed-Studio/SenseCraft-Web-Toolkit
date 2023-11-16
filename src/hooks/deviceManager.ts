import { computed } from 'vue';
import { DeviceType } from '@/store/modules/app';
import deviceManager from '@/sscma/xiao_esp32s3/deviceManager';
import DeviceManagerInterface from '@/sscma/DeviceManagerInterface';
import useDeviceType from './deviceType';

function useDeviceManager() {
  const deviceType = useDeviceType();
  return computed<DeviceManagerInterface | null>(() => {
    const obj = {
      [DeviceType['XIAO ESP32S3']]: deviceManager,
    };
    return obj[deviceType.value as string];
  });
}

export default useDeviceManager;
