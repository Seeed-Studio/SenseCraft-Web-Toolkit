import { computed } from 'vue';
import { Terminal } from 'xterm';
import { DeviceType, deviceTypeObj } from '@/sscma/constants';
import { useAppStore } from '@/store';
import EspSerialDevice from '@/sscma/xiao_esp32s3/EspSerialDevice';
import Himax from '@/sscma/vision_ai_we_II/deviceHimax';

function useDeviceManager() {
  const appStore = useAppStore();
  const device = computed(() => {
    const obj = {
      [deviceTypeObj[DeviceType.XiaoEsp32s3].name]: new EspSerialDevice(),
      [deviceTypeObj[DeviceType.VisionAIWeII].name]: new Himax(),
    };
    return obj[appStore.deviceType as string];
  });

  const term = computed(() => {
    return new Terminal({ cols: 78, rows: 30 });
  });

  return { device, term };
}
export default useDeviceManager;
