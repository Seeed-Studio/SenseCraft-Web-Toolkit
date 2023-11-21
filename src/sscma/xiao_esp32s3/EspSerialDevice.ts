import {
  ESPLoader,
  LoaderOptions,
  Transport,
  IEspLoaderTerminal,
} from 'esptool-js';
import { Message } from '@arco-design/web-vue';
import { delay } from '@/utils/timer';
import Device from '../device';
import { DeviceStatus } from '../types';
import { DeviceType, deviceTypeObj } from '../constants';

class EspSerialDevice extends Device {
  public port: SerialPort | null;

  public transport: Transport | null;

  public esploader: ESPLoader | null;

  private reader: ReadableStreamDefaultReader | null | undefined;

  private writer: WritableStreamDefaultWriter | null | undefined;

  private hasStart: boolean;
  private lastCode: number; // 遍历时缓存的上一个code，用来辅助判断开始和结束
  private cacheData: Array<number>;
  private loggerManager: string[] = [];
  name = 'EspSerialDevice';

  constructor() {
    super();
    this.port = null;

    this.transport = null;
    this.esploader = null;

    this.reader = null;
    this.writer = null;

    this.hasStart = false;
    this.lastCode = -1;
    this.cacheData = [];
  }

  public async requestPort() {
    const serialPort = await navigator.serial.requestPort({
      filters: deviceTypeObj[DeviceType.XiaoEsp32s3].filter.map((e) => ({
        usbVendorId: e.vendorId,
        usbProductId: e.productId,
      })),
    });
    this.port = serialPort;
  }

  public async connect() {
    if (this.port === null) {
      await this.requestPort();
    }
    // 如果当前在esp连接，需要断开
    if (
      (this.deviceStore.deviceStatus === DeviceStatus.EspConnected ||
        this.deviceStore.deviceStatus === DeviceStatus.Flashing) &&
      this.transport
    ) {
      await this.transport.disconnect();
      this.transport = null;
      this.esploader = null;
    }
    navigator.serial.ondisconnect = this.ondisconnect.bind(this);
    this.cacheData = [];
    if (this.port?.readable === null || this.port?.writable === null) {
      await this.port.open({ baudRate: 115200 });
    }

    await this.port?.setSignals({ dataTerminalReady: false });
    await delay(100);
    await this.port?.setSignals({ dataTerminalReady: true });
    await delay(2000);

    this.reader = this.port?.readable?.getReader();
    this.writer = this.port?.writable?.getWriter();
    this.deviceStore.setDeviceStatus(DeviceStatus.SerialConnected);
    this.readLoop();
  }

  public async esploaderConnect(terminal?: IEspLoaderTerminal) {
    if (this.port === null) {
      await this.requestPort();
    }
    navigator.serial.ondisconnect = this.ondisconnect.bind(this);
    // 如果当前在串口连接，需要断开
    if (this.deviceStore.deviceStatus === DeviceStatus.SerialConnected) {
      this.reader?.releaseLock();
      this.writer?.releaseLock();
      await this.port?.close();
    }
    if ((!this.transport || !this.esploader) && this.port) {
      this.transport = new Transport(this.port);
      const flashOptions = {
        transport: this.transport,
        baudrate: 115200,
        terminal,
      } as LoaderOptions;
      this.esploader = new ESPLoader(flashOptions);
    }
    await this.esploader?.main_fn();
    this.deviceStore.setDeviceStatus(DeviceStatus.EspConnected);
  }

  // 串口断开事件
  public ondisconnect(ev: Event) {
    if (this.deviceStore.deviceStatus === DeviceStatus.SerialConnected) {
      Message.error('Device is disconnected');
    }
    this.disconnect().then(() => {
      this.port = null;
      this.transport = null;
      this.esploader = null;
    });
  }

  public cleanLogger() {
    this.loggerManager = [];
  }

  public async disconnect() {
    this.cleanLogger();
    try {
      this.reader?.releaseLock();
      this.writer?.releaseLock();
      await this.port?.close();
    } catch (error) {
      this.port = null;
      console.log(error);
    } finally {
      this.deviceStore.setDeviceStatus(DeviceStatus.UnConnected);
      this.deviceStore.setCurrentAvailableModel(false);
    }
  }

  private readLoop = async () => {
    if (this.reader === null) {
      return;
    }
    let flag = true;
    while (flag) {
      try {
        /* eslint-disable no-await-in-loop */
        if (this.reader) {
          const { value } = await this.reader.read();
          if (value) {
            this.handleReceive(value);
          }
        }
      } catch (error) {
        console.log(error);
        flag = false;
      }
    }
  };

  public handleReceive(data: Uint8Array) {
    this.loggerManager.push(
      `[${new Date()}]: ${this.textDecoder.decode(data)}`
    );
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
      console.log('Device raw log:', this.loggerManager);
      // 解析报错也不知道是哪个指令，只能等请求超时
      console.log(error);
      // this.cacheReject?.('')
    }
  }

  public async write(data: Uint8Array) {
    console.log('Does writer exist?', !!this.writer);
    if (this.writer === null) {
      return;
    }
    const str = this.textDecoder.decode(data);
    console.log('handleWrite:', str);
    this.writer?.write(data);
  }
}

export type { EspSerialDevice };
export default new EspSerialDevice();
