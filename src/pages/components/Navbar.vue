<template>
  <div class="navbar">
    <div class="left-side">
      <a-space>
        <img
          alt="logo"
          src="@/assets/logo.png"
          style="width: 33px; height: 33px"
        />
        <a-typography-title
          :style="{ margin: 0, fontSize: '18px' }"
          :heading="5"
        >
          SenseCraft
        </a-typography-title>
        <icon-menu-fold
          v-if="!topMenu && appStore.device === 'mobile'"
          style="font-size: 22px; cursor: pointer"
          @click="toggleDrawerMenu"
        />
      </a-space>
    </div>
    <div class="center-side">
      <Menu v-if="topMenu" />
    </div>
    <ul class="right-side">
      <li>
        <a-tooltip :content="$t('settings.navbar.faq')">
          <a-button
            class="nav-btn"
            type="outline"
            :shape="'circle'"
            @click="handleFaq"
          >
            <template #icon>
              <icon-question />
            </template>
          </a-button>
        </a-tooltip>
      </li>
      <li>
        <a-tooltip :content="$t('settings.language')">
          <a-button
            class="nav-btn"
            type="outline"
            :shape="'circle'"
            @click="setDropDownVisible"
          >
            <template #icon>
              <icon-language />
            </template>
          </a-button>
        </a-tooltip>
        <a-dropdown trigger="click" @select="changeLocale as any">
          <div ref="triggerBtn" class="trigger-btn"></div>
          <template #content>
            <a-doption
              v-for="item in locales"
              :key="item.value"
              :value="item.value"
            >
              <template #icon>
                <icon-check v-show="item.value === currentLocale" />
              </template>
              {{ item.label }}
            </a-doption>
          </template>
        </a-dropdown>
      </li>
      <li>
        <a-tooltip
          :content="
            theme === 'light'
              ? $t('settings.navbar.theme.toDark')
              : $t('settings.navbar.theme.toLight')
          "
        >
          <a-button
            class="nav-btn"
            type="outline"
            :shape="'circle'"
            @click="handleToggleTheme"
          >
            <template #icon>
              <icon-moon-fill v-if="theme === 'dark'" />
              <icon-sun-fill v-else />
            </template>
          </a-button>
        </a-tooltip>
      </li>
      <li>
        <a-tooltip
          :content="
            log
              ? $t('settings.navbar.log.toHide')
              : $t('settings.navbar.log.toShow')
          "
        >
          <a-button
            :class="['nav-btn', log ? 'focus' : '']"
            type="outline"
            :shape="'circle'"
            @click="handleToggleLog"
          >
            <template #icon>
              <icon-file />
            </template>
          </a-button>
        </a-tooltip>
      </li>
      <li>
        <a-tooltip
          :content="
            isFullscreen
              ? $t('settings.navbar.screen.toExit')
              : $t('settings.navbar.screen.toFull')
          "
        >
          <a-button
            class="nav-btn"
            type="outline"
            :shape="'circle'"
            @click="toggleFullScreen"
          >
            <template #icon>
              <icon-fullscreen-exit v-if="isFullscreen" />
              <icon-fullscreen v-else />
            </template>
          </a-button>
        </a-tooltip>
      </li>
      <li>
        <a-select v-model="deviceType" :style="{}">
          <a-option v-for="name in deviceTypes" :key="name">{{
            name
          }}</a-option>
        </a-select>
      </li>
      <li>
        <a-button
          v-if="deviceStore.deviceStatus === DeviceStatus.SerialConnected"
          type="primary"
          status="danger"
          @click="connect"
          >{{ $t('workplace.device.btn.disconnect') }}</a-button
        >
        <a-button
          v-else
          type="primary"
          :loading="loading"
          :disabled="deviceStore.deviceStatus === DeviceStatus.Flashing"
          @click="disconnect"
          >{{ $t('workplace.device.btn.connect') }}</a-button
        >
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref, inject, watch } from 'vue';
  import { useDark, useToggle, useFullscreen } from '@vueuse/core';
  import { useI18n } from 'vue-i18n';
  import { Message } from '@arco-design/web-vue';
  import { useRouter } from 'vue-router';
  import { useAppStore, useDeviceStore } from '@/store';
  import { LOCALE_OPTIONS } from '@/locale';
  import useLocale from '@/hooks/locale';
  import { DeviceStatus } from '@/sscma';
  import useDeviceManager from '@/hooks/deviceManager';
  import { DeviceType } from '@/store/modules/app';
  import Menu from './Menu.vue';

  const appStore = useAppStore();
  const deviceStore = useDeviceStore();
  const deviceType = ref(appStore.deviceType);
  const { t } = useI18n();
  const deviceManager = useDeviceManager();
  const device = deviceManager.value?.getDevice();
  const router = useRouter();

  const deviceTypes = ref([
    DeviceType['XIAO ESP32S3'],
    DeviceType['XIAO ESP32S4'],
  ]);

  const { changeLocale, currentLocale } = useLocale();
  const { isFullscreen, toggle: toggleFullScreen } = useFullscreen();
  const locales = [...LOCALE_OPTIONS];
  const loading = ref(false);

  const theme = computed(() => {
    return appStore.theme;
  });
  const log = computed(() => {
    return appStore.log;
  });
  const topMenu = computed(() => appStore.topMenu && appStore.menu);
  const isDark = useDark({
    selector: 'body',
    attribute: 'arco-theme',
    valueDark: 'dark',
    valueLight: 'light',
    storageKey: 'arco-theme',
    onChanged(dark: boolean) {
      // overridden default behavior
      appStore.toggleTheme(dark);
    },
  });
  const toggleTheme = useToggle(isDark);
  const handleToggleTheme = () => {
    toggleTheme();
  };

  const handleToggleLog = () => {
    appStore.toggleLog(!appStore.log);
  };

  const handleFaq = () => {
    window.open('https://sensecraftma.seeed.cc/', '_blank');
  };

  const triggerBtn = ref();

  const setDropDownVisible = () => {
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    triggerBtn.value.dispatchEvent(event);
  };

  const toggleDrawerMenu = inject('toggleDrawerMenu') as () => void;

  watch(deviceType, () => {
    const name = router.currentRoute.value?.name;
    if (!name) {
      return;
    }
    appStore.switchDevice(deviceType.value);
    router.replace({
      name,
      params: { deviceType: deviceType.value },
    });
  });

  watch(router.currentRoute, () => {
    const { params } = router.currentRoute.value ?? {};
    if (typeof params?.deviceType === 'string') {
      appStore.switchDevice(deviceType.value);
      deviceType.value = params?.deviceType;
    }
  });

  async function connect() {
    loading.value = true;
    try {
      await device?.connect();
      if (deviceStore.deviceStatus === DeviceStatus.SerialConnected) {
        Message.success(t('workplace.serial.device.connected.successfully'));
      }
    } catch (error) {
      console.error('设备连接失败', error);
    } finally {
      loading.value = false;
    }
  }

  async function disconnect() {
    try {
      await device?.disconnect();
    } catch (error) {
      console.log('断开连接失败', error);
    }
  }
</script>

<style scoped lang="less">
  .navbar {
    display: flex;
    justify-content: space-between;
    height: 100%;
    background-color: var(--color-bg-2);
    border-bottom: 1px solid var(--color-border);
  }

  .left-side {
    display: flex;
    align-items: center;
    padding-left: 20px;
  }

  .center-side {
    flex: 1;
  }

  .right-side {
    display: flex;
    padding-right: 20px;
    list-style: none;

    :deep(.locale-select) {
      border-radius: 20px;
    }

    li {
      display: flex;
      align-items: center;
      padding: 0 10px;
    }

    a {
      color: var(--color-text-1);
      text-decoration: none;
    }

    .nav-btn {
      color: rgb(var(--gray-8));
      font-size: 16px;
      border-color: rgb(var(--gray-2));
    }

    .focus {
      color: #fff;
      background-color: #165dff;
    }

    .trigger-btn,
    .ref-btn {
      position: absolute;
      bottom: 14px;
    }

    .trigger-btn {
      margin-left: 14px;
    }
  }
</style>

<style lang="less">
  .message-popover {
    .arco-popover-content {
      margin-top: 0;
    }
  }
</style>