import { computed } from 'vue';
import xiaoEspP32S3DeviceManager from '@/sscma/xiao_esp32s3/deviceManager';
import DeviceManagerInterface from '@/sscma/DeviceManagerInterface';
import { deviceTypeObj } from '@/sscma/constants';
import visionAiWeIIDeviceManager from '@/sscma/vision_ai_we_II/deviceManager';
import useDeviceType from './deviceType';

function useDeviceManager() {
  const deviceType = useDeviceType();
  return computed<DeviceManagerInterface | null>(() => {
    const obj = {
      [deviceTypeObj['XIAO ESP32S3'].name]: xiaoEspP32S3DeviceManager,
      [deviceTypeObj['Vision AI (WE-II)'].name]: visionAiWeIIDeviceManager,
    };
    return obj[deviceType.value as string];
  });
}

export default useDeviceManager;
