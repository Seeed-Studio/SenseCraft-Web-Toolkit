import { ESPLoader, FlashOptions, Transport } from 'esptool-js';
import useDeviceManager from '@/hooks/deviceManager';
import { useDeviceStore } from '@/store';
import i18n from '@/locale';
import FlasherInterface from '../FlasherInterface';
import { DeviceStatus } from '../types';
import EspSerialDevice from './EspSerialDevice';

class Flasher implements FlasherInterface {
  isNeedConnectDevice = true;
  isNeedResetDevice = true;
  private espLoader: ESPLoader | null = null;
  private transport: Transport | null = null;
  private device: EspSerialDevice | null = null;
  private deviceStore;
  private espLoaderTerminal;

  constructor() {
    const { device, term } = useDeviceManager();
    this.device = device.value as EspSerialDevice;
    this.deviceStore = useDeviceStore();
    this.espLoaderTerminal = {
      clean() {
        term.value?.clear();
      },
      writeLine(data: string) {
        term.value?.writeln(data);
      },
      write(data: string) {
        term.value?.write(data);
      },
    };
  }

  private async espLoaderConnect() {
    if (this.deviceStore.deviceStatus !== DeviceStatus.EspConnected) {
      await this.device?.esploaderConnect(this.espLoaderTerminal);
    }
    this.espLoader = this.device?.esploader ?? null;
    this.transport = this.device?.transport ?? null;
    if (!this.espLoader || !this.transport) {
      throw new Error(i18n.global.t('workplace.serial.no.port'));
    }
  }

  async writeFlashBefore() {
    await this.espLoaderConnect();
  }

  async onWriteFlash(data: any) {
    try {
      this.deviceStore.setDeviceStatus(DeviceStatus.Flashing);
      const flashOptions: FlashOptions = {
        fileArray: data,
        flashSize: 'keep',
        eraseAll: false,
        compress: true,
        reportProgress: (fileIndex, written, total) => {
          console.log('written ', fileIndex, ' file:', (written / total) * 100);
        },
      } as FlashOptions;
      await this.espLoader?.write_flash(flashOptions);
      return true;
    } catch (error) {
      console.error(error, '在烧录的过程中出现了错误');
      return false;
    }
  }

  async onResetDevice() {
    await this.transport?.setDTR(false);
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    await this.transport?.setDTR(true);
  }

  async onConnectDevice() {
    if (this.deviceStore.deviceStatus !== DeviceStatus.SerialConnected) {
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