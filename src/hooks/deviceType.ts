import { computed } from 'vue';
import { useRoute } from 'vue-router';

function useDeviceType() {
  const route = useRoute();

  return computed(() => {
    return route.params?.deviceType;
  });
}

export default useDeviceType;
