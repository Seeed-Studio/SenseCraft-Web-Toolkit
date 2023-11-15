import { computed } from 'vue';
import { DeviceType } from '@/store/modules/app';
import { deviceManager } from '@/senseCraft';
import useDeviceType from './deviceType';

function useDeviceManager() {
  const deviceType = useDeviceType();
  return computed(() => {
    const obj = {
      [DeviceType['XIAO ESP32S3']]: deviceManager,
    };
    return obj[deviceType.value as string];
  });
}

export default useDeviceManager;
