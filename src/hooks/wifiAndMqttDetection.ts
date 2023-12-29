import { onMounted, onUnmounted, watch } from 'vue';
import { DeviceStatus } from '@/sscma';
import { useDeviceStore } from '@/store';
import { delay } from '@/utils/timer';
import useDeviceManager from './deviceManager';

const useWifiAndMqttDetection = () => {
  const deviceStore = useDeviceStore();
  const { device } = useDeviceManager();
  const checkBehaviorStatusAndGetInfo = (behavior: () => Promise<void>) => {
    let isStarted = false;
    let isLoop = true;
    async function start(isFirst = true) {
      if (isStarted) {
        return;
      }
      if (deviceStore.deviceStatus !== DeviceStatus.SerialConnected) {
        return;
      }
      isStarted = true;
      try {
        await delay(isFirst ? 1000 : 5000);
        await behavior();
      } catch (error) {
        console.log('get wifi info error', error);
      } finally {
        isStarted = false;
        if (isLoop) {
          await start(false);
        }
      }
    }
    function stop() {
      isLoop = false;
    }
    return { start, stop };
  };

  const { start: wifiStart, stop: wifiStop } = checkBehaviorStatusAndGetInfo(
    async () => {
      const wifi = await device.value?.getWifi();
      deviceStore.setDeviceIPv4AddressAndStatus(
        wifi?.in4_info?.ip,
        wifi?.status
      );
    }
  );
  const { start: mqttStart, stop: mqttStop } = checkBehaviorStatusAndGetInfo(
    async () => {
      const mqttServer = await device.value?.getMqttServer();
      deviceStore.setDeviceServerState(mqttServer?.status);
    }
  );

  onMounted(wifiStart);
  onMounted(mqttStart);

  onUnmounted(wifiStop);
  onUnmounted(mqttStop);

  watch(
    () => deviceStore.deviceStatus,
    () => {
      wifiStart();
      mqttStart();
    }
  );
};

export default useWifiAndMqttDetection;
