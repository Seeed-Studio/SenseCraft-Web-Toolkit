import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { DeviceType } from '@/store/modules/app';

function useDeviceType() {
  const route = useRoute();

  return computed(() => {
    return route.params?.deviceType ?? DeviceType['XIAO ESP32S3'];
  });
}

export default useDeviceType;
