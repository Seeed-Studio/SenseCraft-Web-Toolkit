import { Message } from '@arco-design/web-vue';
import { delay } from '@/utils/timer';
import Serial from './serial';
import Xmodem from './xmodem';
import { DeviceStatus } from '../types';
import Device from '../device';
import { DeviceType, deviceTypeObj } from '../constants';

class Himax extends Device {
  private serial: Serial | null = null;

  private hasStart: boolean;
  private lastCode: number; // 遍历时缓存的上一个code，用来辅助判断开始和结束
  private cacheData: Array<number>;
  private watchLoop: boolean | undefined = undefined;

  name = 'Grove AI WE2';
  constructor() {
    super();
    this.hasStart = false;
    this.lastCode = -1;
    this.cacheData = [];
  }

  private parseAndProcessData = (data: number[]) => {
    try {
      const buffer = new Uint8Array(data);
      const str = this.textDecoder.decode(buffer);
      const obj = JSON.parse(str);
      const type = obj?.type;
      const name = obj?.name;
      if (type === 0) {
        // 指令响应
        console.log('handleReceive:', obj);
        console.timeEnd(name);
        const resolve = this.resolveMap.get(name);
        if (resolve) resolve(obj);
      } else if (type === 1) {
        // 事件
        const code = obj?.code;
        const listener = this.eventMap.get(name);
        if (listener?.(obj) && code !== 0) {
          Message.error(
            `Please check device connection status, errorCode[${code}]`
          );
        }
      }
    } catch (error) {
      // console.error(
      //   'An error occurred while parsing the returned data:',
      //   error
      // );
    }
  };

  private readLoop = async () => {
    while (true) {
      if (!this.serial) {
        return;
      }
      if (this.watchLoop && this.serial.available()) {
        // eslint-disable-next-line no-await-in-loop
        const data = await this.serial.read();
        try {
          let index = 0;
          while (index < data.length) {
            const num = data[index];
            if (num === 0x7b) {
              // \{
              if (this.lastCode === 0x0d) {
                // \r
                this.hasStart = true;
                this.cacheData.push(num);
              } else if (this.hasStart) {
                this.cacheData.push(num);
              }
            } else if (num === 0x0a) {
              // \n
              if (this.lastCode === 0x7d) {
                // }
                this.hasStart = false;
                const tempCache = [...this.cacheData];
                this.parseAndProcessData(tempCache);
                this.cacheData = [];
              } else if (this.hasStart) {
                this.cacheData.push(num);
              }
            } else if (this.hasStart) {
              this.cacheData.push(num);
            }
            this.lastCode = num;
            index += 1;
          }
        } catch (error) {
          // 解析报错也不知道是哪个指令，只能等请求超时
          console.log(error);
          // this.cacheReject?.('')
        }
      }
      // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  };

  public async hardReset(): Promise<void> {
    if (!this.serial) {
      return;
    }
    await this.serial.setRTS(false);
    await delay(100);
    await this.serial.setRTS(true);
  }

  public async flash(data: Uint8Array, offset: number): Promise<void> {
    if (this.deviceStore.deviceStatus === DeviceStatus.UnConnected) {
      await this.connect();
    }
    console.log('flash', data, offset);
    this.watchLoop = false;
    const xmodem = new Xmodem({});
    const progress = (current: number, total: number, percent: number) => {
      console.log(`progress ${current}/${total} ${percent}%`);
      this.deviceStore.setFlashProgress(`${percent}%`);
    };
    if (!this.serial) {
      return;
    }
    xmodem.setRead(this.serial.readBytes.bind(this.serial));
    xmodem.setWrite(this.serial.write.bind(this.serial));
    xmodem.setProgress(progress);

    const enterBootloader = async () => {
      await this.hardReset();
      if (!this.serial) {
        return;
      }
      this.serial.clear();
      // send '1' every 10ms by timer
      const timer = setInterval(() => {
        if (!this.serial) {
          return;
        }
        this.serial.writeString('1');
      }, 10);
      const str = await this.serial.readUntilString(
        'Xmodem download and burn FW image',
        100
      );
      clearTimeout(timer);
      if (str.includes('Xmodem download and burn FW image')) {
        this.serial.writeString('1');
      } else {
        throw new Error('Error: no response from device');
      }
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 100));
      console.log('enterBootloader done');
      this.serial.clear();
    };

    const flashComplete = async (reset: string) => {
      console.log('flashComplete');
      if (!this.serial) {
        return;
      }
      const str = await this.serial.readUntilString(
        'Do you want to end file transmission and reboot system',
        10000
      );
      if (
        str.includes('Do you want to end file transmission and reboot system')
      ) {
        this.serial.writeString(reset);
      } else {
        throw new Error('Error: no response from device');
      }
      console.log('flashComplete done');
    };

    await enterBootloader();

    try {
      if (offset !== 0) {
        const config = new Uint8Array(128);
        config.fill(0xff);
        config[0] = 0xc0;
        config[1] = 0x5a;
        config[2] = offset & 0xff;
        config[3] = (offset >> 8) & 0xff;
        config[4] = (offset >> 16) & 0xff;
        config[5] = (offset >> 24) & 0xff;
        config[6] = 0x00;
        config[7] = 0x00;
        config[8] = 0x00;
        config[9] = 0x00;
        config[10] = 0x5a;
        config[11] = 0xc0;
        this.serial.clear();
        await xmodem.send(config);
        await flashComplete('n');
      }
      this.serial.clear();
      await xmodem.send(data);
    } catch (e: any) {
      throw new Error(e?.message);
    }
    await flashComplete('y');
    this.watchLoop = true;
  }

  public async write(data: Uint8Array) {
    const str = this.textDecoder.decode(data);
    console.log('Does serial exist?', !!this.serial, 'handleWrite:', str);
    if (!this.serial) {
      return;
    }
    await this.serial.write(data);
  }

  public async eraseFlash(): Promise<void> {
    await this.flash(new Uint8Array(128), 0x400000);
  }

  public async requestPort() {
    const serialPort = await navigator.serial.requestPort({
      filters: deviceTypeObj[DeviceType.GroveAIWE2].filter.map((e) => ({
        usbVendorId: e.vendorId,
        usbProductId: e.productId,
      })),
    });
    this.serial = new Serial(serialPort);
  }

  public async connect(): Promise<void> {
    if (!this.serial) {
      await this.requestPort();
    }
    await this.serial?.open({ baudRate: 921600 });
    if (!this.watchLoop) {
      this.readLoop();
      this.watchLoop = true;
    }
    navigator.serial.ondisconnect = async () => {
      Message.warning('Device disconnected');
      await this.disconnect();
      this.serial = null;
    };
    await this.hardReset();
    // eslint-disable-next-line no-promise-executor-return
    await delay(2000);
    this.serial?.clear();
    this.deviceStore.setDeviceStatus(DeviceStatus.SerialConnected);
  }

  public async disconnect(): Promise<void> {
    console.log('Called when disconnected, Does serial exist?', !!this.serial);
    this.break();
    if (!this.serial) {
      return;
    }
    try {
      await this.serial.close();
    } catch (error: any) {
      console.error(error.name, '----------', error.message);
    } finally {
      this.deviceStore.setDeviceStatus(DeviceStatus.UnConnected);
      this.deviceStore.setCurrentAvailableModel(false);
      this.watchLoop = false;
    }
  }

  public async getAction(): Promise<any> {
    try {
      const tag = 'ACTION?';
      const command = this.client.getAction();
      const response = await this.sendCommand(command, tag);
      const code = response.code;
      this.deleteMap(tag);
      if (code === 0) {
        const action = response.data?.action;
        const conditionMatches = action.match(
          /(\w+\(.*?\))(>=|<=|==|!=|>|<)(\d+)/g
        );
        if (conditionMatches) {
          return conditionMatches[0];
        }
        return null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  public async setAction(
    target: number,
    condition: string,
    score: number
  ): Promise<boolean> {
    try {
      const tag = 'ACTION';
      const command = `AT+ACTION="((max_score(target,${target})${condition}${score})&&led(1))||led(0)"\r`;
      const response = await this.sendCommand(command, tag);
      const code = response.code;
      this.deleteMap(tag);
      return code === 0;
    } catch (error) {
      return false;
    }
  }

  public async invoke(times: number): Promise<any> {
    try {
      const tag = 'INVOKE';
      const command = `AT+INVOKE=${times},0,0\r`;
      const response = await this.sendCommand(command, tag);
      const code = response.code;
      this.resolveMap.delete(tag);
      this.rejectMap.delete(tag);
      if (code === 0) {
        const data = response.data;
        if (data) {
          const config = data.algorithm?.config;
          if (config) {
            const tiou = config.tiou || 0;
            const tscore = config.tscore || 0;
            this.deviceStore.setIOU(tiou);
            this.deviceStore.setScore(tscore);
          }
          this.deviceStore.setIsInvoke(true);
        }
        return data;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}
export type { Himax };
export default new Himax();
