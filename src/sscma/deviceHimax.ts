import { Message } from '@arco-design/web-vue';
import Device from './device';
import Serial from './serial';
import Xmodem from './xmodem';
import { DeviceStatus } from './types';

export default class Himax extends Device {
  private serial: Serial;

  private hasStart: boolean;
  private lastCode: number; // 遍历时缓存的上一个code，用来辅助判断开始和结束
  private cacheData: Array<number>;
  private watchLoop: boolean;

  constructor(port: SerialPort) {
    super();
    this.serial = new Serial(port);
    this.hasStart = false;
    this.lastCode = -1;
    this.cacheData = [];
    this.deviceStore.setDeviceType('we_ii');
  }

  private readLoop = async () => {
    while (true) {
      if (this.watchLoop && this.serial.available()) {
        const data = await this.serial.read();
        // console.log('handleReceive:', this.textDecoder.decode(data));
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
                try {
                  const buffer = new Uint8Array(this.cacheData);
                  const str = this.textDecoder.decode(buffer);
                  const obj = JSON.parse(str);
                  const type = obj?.type;
                  const name = obj?.name;
                  if (type === 0) {
                    // 指令响应
                    console.log('handleReceive:', obj);
                    const resolve = this.resolveMap.get(name);
                    if (resolve) resolve(obj);
                  } else if (type === 1) {
                    // 事件
                    const code = obj?.code;
                    const listener = this.eventMap.get(name);
                    listener?.(obj);
                    if (code !== 0) {
                      Message.error(
                        `Please check device connection status, errorCode[${code}]`
                      );
                    }
                  }
                } catch (error) {
                  console.log(error);
                  const buffer = new Uint8Array(this.cacheData);
                  const str = this.textDecoder.decode(buffer);
                  console.log('handleReceive:', str);
                }
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
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  };

  public async hardReset(): Promise<void> {
    this.serial.setRTS(false);
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.serial.setRTS(true);
  }

  public async flash(data: Uint8Array, offset: number): Promise<void> {
    if (this.deviceStore.deviceStatus === DeviceStatus.UnConnected) {
      console.log('connect');
      await this.connect();
    }
    this.watchLoop = false;
    const xmodem = new Xmodem({});
    const progress = (current: number, total: number, percent: number) => {
      console.log(`progress ${current}/${total} ${percent}%`);
    };

    xmodem.setRead(this.serial.readBytes.bind(this.serial));
    xmodem.setWrite(this.serial.write.bind(this.serial));
    xmodem.setProgress(progress);

    const enterBootloader = async () => {
      console.log('enterBootloader');
      await this.hardReset();
      this.serial.clear();
      // send '1' every 10ms by timer
      const timer = setInterval(() => {
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
      await new Promise((resolve) => setTimeout(resolve, 100));
      console.log('enterBootloader done');
      this.serial.clear();
    };

    const flashComplete = async (reset: string) => {
      console.log('flashComplete');
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
    } catch (e) {
      throw new Error(e);
    }
    await flashComplete('y');
    this.watchLoop = true;
  }

  public async write(data: Uint8Array) {
    const str = this.textDecoder.decode(data);
    console.log('handleWrite:', str);
    this.serial.write(data);
  }

  public async eraseFlash(): Promise<void> {
    await this.flash(new Uint8Array(128), 0x400000);
  }

  public async connect(): Promise<void> {
    await this.serial.open({ baudRate: 921600 });
    if (!this.watchLoop) {
      this.readLoop();
      this.watchLoop = true;
    }
    navigator.serial.ondisconnect = () => {
      Message.warning('Device disconnected');
      this.disconnect();
    };
    await this.hardReset();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    this.serial.clear();
    this.deviceStore.setDeviceStatus(DeviceStatus.SerialConnected);
  }

  public async disconnect(): Promise<void> {
    await this.serial.close();
    this.deviceStore.setDeviceStatus(DeviceStatus.UnConnected);
    this.watchLoop = false;
  }
}
