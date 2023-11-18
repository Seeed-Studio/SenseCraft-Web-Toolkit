import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '@/store';

function useDeviceType() {
  const route = useRoute();
  const appStore = useAppStore();

  const currentDeviceType = computed(() => {
    return route.params?.deviceType;
  });
  if (appStore.deviceType !== currentDeviceType.value) {
    appStore.switchDevice(currentDeviceType.value as string);
  }

  return currentDeviceType;
}
// XIAO ESP32S3 ------deviceType-----
export default useDeviceType;
