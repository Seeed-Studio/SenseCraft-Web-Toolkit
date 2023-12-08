import { computed } from 'vue';
import { Terminal } from 'xterm';
import { DeviceType, deviceTypeObj } from '@/sscma/constants';
import { useDeviceStore } from '@/store';
import espSerialDevice from '@/sscma/xiao_esp32s3/EspSerialDevice';
import hiMaxDevice from '@/sscma/grove_ai_we2/deviceHimax';

const term = new Terminal({ cols: 78, rows: 30 });
function useDeviceManager() {
  const deviceStore = useDeviceStore();
  const device = computed(() => {
    const obj = {
      [deviceTypeObj[DeviceType.XiaoEsp32s3].id]: espSerialDevice,
      [deviceTypeObj[DeviceType.GroveAIWE2].id]: hiMaxDevice,
    };
    return obj[deviceStore.deviceType.id as string];
  });

  return { device, term };
}
export default useDeviceManager;
