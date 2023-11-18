import { ESPLoader } from 'esptool-js';
import useDeviceManager from '@/hooks/deviceManager';
import { useDeviceStore } from '@/store';
import { delay } from '@/utils/timer';
import FlasherInterface from '../FlasherInterface';
import { DeviceStatus } from '../types';
import DeviceHimax from './deviceHimax';

class Flasher implements FlasherInterface {
  isNeedConnectDevice = false;
  isNeedResetDevice = false;
  private espLoader: ESPLoader | null = null;
  private device: DeviceHimax | null = null;
  private deviceStore;

  constructor() {
    const deviceManager = useDeviceManager();
    this.device = deviceManager.value?.getDevice<DeviceHimax>() ?? null;
    this.deviceStore = useDeviceStore();
  }

  private async espLoaderConnect() {}

  async writeFlashBefore() {
    await this.onConnectDevice();
  }

  async onWriteFlash(data: any) {
    try {
      this.deviceStore.setDeviceStatus(DeviceStatus.Flashing);
      for (let index = 0; index < data.length; index += 1) {
        const item = data[index];
        // eslint-disable-next-line no-await-in-loop
        await this.device?.flash(item.data, item.address);
      }
      return true;
    } catch (error) {
      console.error(error, '在烧录的过程中出现了错误');
      return false;
    }
  }

  async onResetDevice() {
    await this.device?.hardReset();
    await delay(500);
  }

  async onConnectDevice() {
    if (!this.deviceStore.ready) {
      await this.device?.connect();
    }
  }

  async onEraseFlashBefore() {
    await this.espLoaderConnect();
  }

  async onEraseFlash() {
    await this.espLoader?.erase_flash();
    return true;
  }
}

export default Flasher;
