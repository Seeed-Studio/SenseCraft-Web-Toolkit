import { computed } from 'vue';
import { Terminal } from 'xterm';
import { DeviceType, deviceTypeObj } from '@/sscma/constants';
import { useAppStore } from '@/store';
import espSerialDevice from '@/sscma/xiao_esp32s3/EspSerialDevice';
import hiMaxDevice from '@/sscma/vision_ai_we_II/deviceHimax';

const term = new Terminal({ cols: 78, rows: 30 });
function useDeviceManager() {
  const appStore = useAppStore();
  const device = computed(() => {
    const obj = {
      [deviceTypeObj[DeviceType.XiaoEsp32s3].name]: espSerialDevice,
      [deviceTypeObj[DeviceType.VisionAIWeII].name]: hiMaxDevice,
    };
    return obj[appStore.deviceType as string];
  });

  return { device, term };
}
export default useDeviceManager;
