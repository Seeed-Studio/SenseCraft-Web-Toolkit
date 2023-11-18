<script setup lang="ts">
  import { watch, onMounted, onBeforeUnmount, ref } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import useDeviceManager from '@/hooks/deviceManager';
  import { useDeviceStore } from '@/store';
  import Preview from '../components/Preview.vue';

  const { device } = useDeviceManager();
  const deviceStore = useDeviceStore();
  const invoke = ref<boolean>(false);
  const disable = ref<boolean>(true);
  const previewRef = ref<InstanceType<typeof Preview> | null>(null);
  const eventName = 'INVOKE';

  const handelRefresh = async () => {
    if (deviceStore.ready) {
      disable.value = false;
      if (previewRef.value?.onInvoke) {
        device.value?.addEventListener(eventName, previewRef.value?.onInvoke);
      }
      const isInvoke = await device.value?.isInvoke();
      if (isInvoke) {
        invoke.value = true;
        deviceStore.setIsInvoke(true);
      } else {
        const result = await device.value?.invoke(-1);
        if (result) {
          invoke.value = true;
        } else {
          Message.error('Invoke failed, please check device connection');
          invoke.value = false;
        }
      }
    } else {
      deviceStore.setIsInvoke(false);
      disable.value = true;
      invoke.value = false;
    }
  };
  watch(() => deviceStore.ready, handelRefresh);

  onMounted(handelRefresh);

  onBeforeUnmount(() => {
    device.value?.removeEventListener(eventName);
  });
</script>

<template>
  <Preview ref="previewRef" />
</template>
