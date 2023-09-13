import {
  ESPLoader,
  LoaderOptions,
  Transport,
  IEspLoaderTerminal,
} from 'esptool-js';
import { Message } from '@arco-design/web-vue';
import Device from './device';
import { DeviceStatus } from './types';

export default class Serial extends Device {

  public port: SerialPort | null;

  public transport: Transport | null;

  public esploader: ESPLoader | null;

  private reader: ReadableStreamDefaultReader | null | undefined;

  private writer: WritableStreamDefaultWriter | null | undefined;

  private hasStart: boolean;
  private lastCode: number; // 遍历时缓存的上一个code，用来辅助判断开始和结束
  private cacheData: Array<number>;

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

  public async connect() {
    try {
      if (this.port === null) {
        try {
          const serialPort = await navigator.serial.requestPort();
          this.port = serialPort;
        } catch (error) {
          console.log(error)
          Message.error('Request serial port failed');
          return
        }
      }
      // 如果当前在esp连接，需要断开
      if (
        (this.deviceStore.deviceStatus === DeviceStatus.EspConnected || this.deviceStore.deviceStatus === DeviceStatus.Burning) &&
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
      console.log(error)
      Message.error('Device connect failed');
    }
  }

  public async esploaderConnect(terminal?: IEspLoaderTerminal) {
    try {
      if (this.port === null) {
        try {
          const serialPort = await navigator.serial.requestPort();
          this.port = serialPort;
        } catch (error) {
          console.log(error)
          Message.error('Request serial port failed');
          return
        }
      }
      navigator.serial.ondisconnect = this.ondisconnect.bind(this);
      // 如果当前在串口连接，需要断开
      if (this.deviceStore.deviceStatus === DeviceStatus.SerialConnected) {
        this.reader?.releaseLock();
        this.writer?.releaseLock();
        await this.port?.close();
      }
      if (!this.transport || !this.esploader) {
        this.transport = new Transport(this.port);
        const flashOptions = {
          transport: this.transport,
          baudrate: 115200,
          terminal,
        } as LoaderOptions;
        this.esploader = new ESPLoader(flashOptions);
      }
      await this.esploader.main_fn();
      this.deviceStore.setDeviceStatus(DeviceStatus.EspConnected);
    } catch (error) {
      console.log(error)
      Message.error('Device connect failed');
    }
  }

  // 串口断开事件
  public ondisconnect(ev: Event) {
    this.disconnect().then(() => {
      this.port = null;
      this.transport = null;
      this.esploader = null;
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
      let index = 0
      while (index < data.length) {
        const num = data[index];
        if (num === 0x7b) {// \{
          if (this.lastCode === 0x0d) {// \r
            this.hasStart = true;
            this.cacheData.push(num);
          } else if (this.hasStart) {
            this.cacheData.push(num);
          }
        } else if (num === 0x0a) { // \n
          if (this.lastCode === 0x7d) {// }
            this.hasStart = false;
            try {
              const buffer = new Uint8Array(this.cacheData);
              const str = this.textDecoder.decode(buffer);
              const obj = JSON.parse(str);
              const type = obj?.type;
              const name = obj?.name;
              if (type === 0) {// 指令响应
                console.log('handleReceive:', obj)
                const resolve = this.resolveMap.get(name)
                if (resolve) resolve(obj)
              } else if (type === 1) { // 事件
                const code = obj?.code;
                if (code === 0) {
                  const listener = this.eventMap.get(name);
                  listener?.(obj.data)
                } else {
                  Message.error(`Please check device connection status, errorCode[${code}]`);
                }
              }
            } catch (error) {
              console.log(error)
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
      console.log(error)
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
