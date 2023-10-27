import {
  ESPLoader,
  LoaderOptions,
  Transport,
  IEspLoaderTerminal,
} from 'esptool-js';
import { Message } from '@arco-design/web-vue';
import Device from './device';
import { DeviceStatus } from './types';
import DEVICE_LIST from './constants';

export default class ESP extends Device {
  public port: SerialPort | null;

  public transport: Transport | null;

  public flasher: ESPLoader | null;

  private reader: ReadableStreamDefaultReader | null | undefined;

  private writer: WritableStreamDefaultWriter | null | undefined;

  private hasStart: boolean;
  private lastCode: number; // 遍历时缓存的上一个code，用来辅助判断开始和结束
  private cacheData: Array<number>;

  constructor() {
    super();
    this.port = null;

    this.transport = null;
    this.flasher = null;

    this.reader = null;
    this.writer = null;

    this.hasStart = false;
    this.lastCode = -1;
    this.cacheData = [];
  }

  private checkDevice() {
    if (this.port === null) {
      Message.error('Device is not connected');
      throw new Error('Device is not connected');
    }
    const vendorId = this.port.getInfo().usbVendorId;
    const productId = this.port.getInfo().usbProductId;
    this.deviceStore.deviceType = '';
    for (let i = 0; i < DEVICE_LIST.length; i += 1) {
      const device = DEVICE_LIST[i];
      for (let j = 0; j < device.filter.length; j += 1) {
        const filter = device.filter[j];
        if (vendorId === filter.vendorId && productId === filter.productId) {
          this.deviceStore.setDeviceType(device.name);
          break;
        }
        if (this.deviceStore.deviceType !== '') {
          break;
        }
      }
    }
    if (this.deviceStore.deviceType === '') {
      Message.error('Device is not supported');
      throw new Error('Device is not supported');
    }
  }

  public async reset() {
    await this.transport?.setDTR(false);
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    await this.transport?.setDTR(true);
  }

  public async connect(baudrate = 921600) {
    try {
      if (this.port === null) {
        try {
          const serialPort = await navigator.serial.requestPort();
          this.port = serialPort;
          this.checkDevice();
        } catch (error) {
          this.port = null;
          console.log(error);
          Message.error('Request serial port failed');
          return;
        }
      }
      // 如果当前在esp连接，需要断开
      if (
        (this.deviceStore.deviceStatus === DeviceStatus.FlasherConnected ||
          this.deviceStore.deviceStatus === DeviceStatus.Flashing) &&
        this.transport
      ) {
        await this.transport.disconnect();
        this.transport = null;
        this.flasher = null;
      }
      navigator.serial.ondisconnect = this.ondisconnect.bind(this);
      this.cacheData = [];
      if (this.port?.readable === null || this.port?.writable === null) {
        await this.port.open({ baudRate: baudrate });
      }

      await this.port?.setSignals({ dataTerminalReady: false });
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
      await this.port?.setSignals({ dataTerminalReady: true });
      await new Promise((resolve) => {
        setTimeout(resolve, 2000);
      });

      this.reader = this.port?.readable?.getReader();
      this.writer = this.port?.writable?.getWriter();
      this.deviceStore.setDeviceStatus(DeviceStatus.SerialConnected);
      this.readLoop();
    } catch (error) {
      console.log(error);
      Message.error('Device connect failed');
    }
  }

  public async flasherConnect(terminal?: IEspLoaderTerminal) {
    try {
      if (this.port === null) {
        try {
          const serialPort = await navigator.serial.requestPort();
          this.port = serialPort;
          this.checkDevice();
        } catch (error) {
          this.port = null;
          console.log(error);
          Message.error('Request serial port failed');
          return;
        }
      }
      navigator.serial.ondisconnect = this.ondisconnect.bind(this);
      // 如果当前在串口连接，需要断开
      if (this.deviceStore.deviceStatus === DeviceStatus.SerialConnected) {
        this.reader?.releaseLock();
        this.writer?.releaseLock();
        await this.port?.close();
      }
      if (!this.transport || !this.flasher) {
        if (this.deviceStore.deviceType.toUpperCase().includes('ESP32')) {
          this.transport = new Transport(this.port);
          const flashOptions = {
            transport: this.transport,
            baudrate: 115200,
            terminal,
          } as LoaderOptions;
          this.flasher = new ESPLoader(flashOptions);
          await this.flasher.main_fn();
          this.deviceStore.setDeviceStatus(DeviceStatus.FlasherConnected);
        } else {
          Message.error('Device is not supported for flasher');
          throw new Error('Device is not supported for flasher');
        }
      }
    } catch (error) {
      console.log(error);
      Message.error('Device connect failed');
    }
  }

  // 串口断开事件
  public ondisconnect(ev: Event) {
    this.disconnect().then(() => {
      this.port = null;
      this.transport = null;
      this.flasher = null;
      Message.error('Device is disconnected');
    });
  }

  public async disconnect() {
    try {
      this.deviceStore.setDeviceStatus(DeviceStatus.UnConnected);
      this.reader?.releaseLock();
      this.writer?.releaseLock();
      await this.port?.close();
    } catch (error) {
      this.port = null;
      console.log(error);
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
          this.handleReceive(value);
        }
      } catch (error) {
        console.log(error);
        flag = false;
      }
    }
  };

  public handleReceive(data: Uint8Array) {
    // const str = this.textDecoder.decode(data);
    // console.log('handleReceive', str);
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

  public async write(data: Uint8Array) {
    if (this.writer === null) {
      return;
    }
    const str = this.textDecoder.decode(data);
    console.log('handleWrite:', str);
    this.writer?.write(data);
  }
}
