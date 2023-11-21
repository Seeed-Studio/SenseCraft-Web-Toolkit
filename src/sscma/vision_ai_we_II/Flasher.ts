import useDeviceManager from '@/hooks/deviceManager';
import { useDeviceStore } from '@/store';
import { delay } from '@/utils/timer';
import FlasherInterface from '../FlasherInterface';
import type { Himax as DeviceHimax } from './deviceHimax';

class Flasher implements FlasherInterface {
  isNeedConnectDevice = false;
  isNeedResetDevice = true;
  private device: DeviceHimax | null = null;
  private deviceStore;

  constructor() {
    const { device } = useDeviceManager();
    this.device = device.value as DeviceHimax;
    this.deviceStore = useDeviceStore();
  }

  async writeFlashBefore() {
    await this.onConnectDevice();
  }

  async onWriteFlash(data: any) {
    try {
      for (let index = 0; index < data.length; index += 1) {
        const item = data[index];
        // eslint-disable-next-line no-await-in-loop
        await this.device?.flash(item.data, item.address);
      }
      return true;
    } catch (error) {
      console.error('An error occurred during the burning process:', error);
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
    await this.onConnectDevice();
  }

  async onEraseFlash() {
    await this.device?.eraseFlash();
    this.deviceStore.setCurrentAvailableModel(false);
    return true;
  }
}

export default Flasher;
