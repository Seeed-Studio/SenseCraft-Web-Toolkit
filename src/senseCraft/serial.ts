import {
  ESPLoader,
  LoaderOptions,
  Transport,
  IEspLoaderTerminal,
} from 'esptool-js';
import Device from './device';
import { DEVICESTATUS } from './enums';

export default class Serial extends Device {
  public port: SerialPort | null;

  public transport: Transport | null;

  public esploader: ESPLoader | null;

  private reader: ReadableStreamDefaultReader | null | undefined;

  private writer: WritableStreamDefaultWriter | null | undefined;

  public onReceive: any;

  // public onReceiveError: any;

  constructor() {
    super();
    this.port = null;

    this.transport = null;
    this.esploader = null;

    this.reader = null;
    this.writer = null;
    this.onReceive = null;
  }

  public async connect() {
    if (this.port === null) {
      const serialPort = await navigator.serial.requestPort();
      this.port = serialPort;
    }
    // 如果当前在esp连接，需要断开
    if (
      this.deviceStore.connectStatus === DEVICESTATUS.ESPCONNECTED &&
      this.transport
    ) {
      await this.transport.disconnect();
      this.transport = null;
      this.esploader = null;
    }
    navigator.serial.ondisconnect = this.ondisconnect.bind(this);
    this.data_buffer = new Uint8Array(0);

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
    this.deviceStore.setConnectStatus(DEVICESTATUS.SERIALCONNECTED);
    this.readLoop();
  }

  public async esploaderConnect(terminal?: IEspLoaderTerminal) {
    if (this.port === null) {
      const serialPort = await navigator.serial.requestPort();
      this.port = serialPort;
    }
    navigator.serial.ondisconnect = this.ondisconnect.bind(this);
    // 如果当前在串口连接，需要断开
    if (this.deviceStore.connectStatus === DEVICESTATUS.SERIALCONNECTED) {
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
    this.deviceStore.setConnectStatus(DEVICESTATUS.ESPCONNECTED);
  }

  // 串口断开事件
  public ondisconnect(ev: Event) {
    this.disconnect().then(() => {
      this.port = null;
      this.transport = null;
      this.esploader = null;
    });
  }

  public async disconnect() {
    try {
      this.deviceStore.setConnectStatus(DEVICESTATUS.UNCONNECTED);
      this.reader?.releaseLock();
      this.writer?.releaseLock();
      await this.port?.close();
    } catch (error) {
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
        console.log('error', error);
        flag = false;
      }
    }
  };

  public handleReceive(data: Uint8Array) {
    const buffer = new Uint8Array(this.data_buffer.length + data.length);
    buffer.set(this.data_buffer);
    buffer.set(new Uint8Array(data.buffer), this.data_buffer.length);
    this.data_buffer = buffer;
    const str = this.textDecoder.decode(this.data_buffer);
    console.log('handleReceive', str);

    if (str.includes('}\r')) {
      try {
        const pe = str.match(/\r\n{.*}\r/g);
        if (pe === null) return;
        const res = pe[0];
        const obj = JSON.parse(res);
        if (obj.type === 'AT') {
          this.response = obj.data.trim();
          this.ack = true;
        } else if (obj.type === 'log') {
          if (this.onLogger !== null) this.onLogger(obj);
        } else if (obj.type === 'result') {
          if (this.onPreview !== null) this.onPreview(str);
        } else if (obj.type === 'preview') {
          const img = obj.img.replace(/[^A-Za-z0-9+/=]/g, '');
          const byteCharacters = atob(img);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i += 1) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/jpeg' });
          if (this.onMonitor !== null) this.onMonitor(blob);
        }
      } catch (e) {
        console.log(e);
      } finally {
        this.data_buffer = new Uint8Array(0);
      }
    }
  }

  public async write(data: Uint8Array) {
    if (this.writer === null) {
      return;
    }
    this.writer?.write(data);
  }
}
