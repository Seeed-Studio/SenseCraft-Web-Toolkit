import { ATClient } from './atclient';

const JPEG_MAGIC = 0x2b2d2b2d;
const TEXT_MAGIC = 0x0f100e12;

export class ATClientV1 extends ATClient {
  public port: any;

  private textEncoder = new TextEncoder();

  private textDecoder = new TextDecoder();

  private response: string;

  private ack: boolean;

  private status: number;

  private recv_size: number;

  private execpt_size: number;

  private data_buffer: Uint8Array;

  public onMonitor: any;

  public onLogger: any;

  constructor(port: any) {
    super('v1');
    this.port = port;
    this.response = '';
    this.ack = false;
    this.recv_size = 0;
    this.execpt_size = 0;
    this.data_buffer = new Uint8Array(0);
    this.textDecoder = new TextDecoder();
    this.textEncoder = new TextEncoder();
    this.status = 0; // 0: idle, 1: invoke, 2: logger
    this.onMonitor = null;
    this.onLogger = null;
    this.port.onReceive = this.handleReceive.bind(this);
  }

  private handleReceive(data: any) {
    if (data.byteLength === 8 && (data.getUint32(0) === JPEG_MAGIC || data.getUint32(0) === TEXT_MAGIC)) {
      this.recv_size = 0;
      this.execpt_size = data.getUint32(4);
      this.data_buffer = new Uint8Array(this.execpt_size);
      if (data.getUint32(0) === JPEG_MAGIC) {
        this.status = 1;
      } else if (data.getUint32(0) === TEXT_MAGIC) {
        this.status = 2;
      }
    } else {
      const available = Math.min(
        data.byteLength,
        this.execpt_size - this.recv_size
      );
      this.data_buffer.set(
        new Uint8Array(data.buffer, 0, available),
        this.recv_size
      );
      this.recv_size += available;
    }
    if (this.execpt_size !== 0 && this.recv_size >= this.execpt_size) {
      this.execpt_size = 0;
      this.recv_size = 0;
      if (this.status === 1) {
        const uint8ArrayToBase64 = (arr: Uint8Array) => {
          const CHUNK_SIZE = 0x8000; // arbitrary number
          let index = 0;
          let result = '';
          while (index < arr.length) {
            const slice = arr.subarray(
              index,
              Math.min(index + CHUNK_SIZE, arr.length)
            );
            result += String.fromCharCode.apply(null, slice);
            index += CHUNK_SIZE;
          }
          return btoa(result);
        };
        const binaryString = uint8ArrayToBase64(this.data_buffer);
        if (this.onMonitor !== null) this.onMonitor(binaryString, 270);
      } else if (this.status === 2) {
        const str = this.textDecoder
          .decode(this.data_buffer)
          .replace(/\r|\n/g, '');
        try {
          const obj = JSON.parse(str);
          console.log(obj);
          if (obj.type === 'AT') {
            if (obj.response !== 'OK') {
              this.response = obj.response;
            }
            this.ack = true;
          } else if (obj.type === 'log') {
            if (this.onLogger !== null) this.onLogger(obj);
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
  }

  public async getID(): Promise<string> {
    await this.sendCommand('AT+ID\r\n', 1000);
    const cmd = this.response.split(':')[0];
    const value = this.response.split(':')[1];
    if (cmd === 'ID' && value !== undefined) {
      return value.trim();
    }
    return '';
  }

  public async getVersion(): Promise<string> {
    await this.sendCommand('AT+VERSION\r\n', 1000);
    const cmd = this.response.split(':')[0];
    const value = this.response.split(':')[1];
    if (cmd === 'Version' && value !== undefined) {
      return value.trim();
    }
    return '';
  }

  public async getDeviceName(): Promise<string> {
    await this.sendCommand('AT+NAME\r\n', 1000);
    const cmd = this.response.split(':')[0];
    const value = this.response.split(':')[1];
    if (cmd === 'NAME' && value !== undefined) {
      return value.trim();
    }
    return '';
  }

  public async setModel(model: string): Promise<boolean> {
    await this.sendCommand(`AT+MODEL=${model}\r\n`, 1000);
    return true;
  }

  public async getModel(): Promise<string> {
    await this.sendCommand('AT+MODEL?\r\n', 1000);
    const cmd = this.response.split(':')[0];
    const value = this.response.split(':')[1];
    if (cmd === 'MODEL' && value !== undefined) {
      return value.trim();
    }
    return '';
  }

  public async getModelList(): Promise<string[]> {
    await this.sendCommand('AT+VMODEL\r\n', 1000);
    const cmd = this.response.split(':')[0];
    const value = this.response.split(':')[1];
    if (cmd === 'VMODEL' && value !== undefined) {
      return value.trim().split(',');
    }
    return [];
  }

  public async setAlgorithm(algorithm: string): Promise<boolean> {
    await this.sendCommand(`AT+ALGO=${algorithm}\r\n`, 1000);
    return true;
  }

  public async getAlgorithm(): Promise<string> {
    await this.sendCommand('AT+ALGO?\r\n', 1000);
    const cmd = this.response.split(':')[0];
    const value = this.response.split(':')[1];
    if (cmd === 'ALGORITHM' && value !== undefined) {
      return value.trim();
    }
    return '';
  }

  public async setConfidence(confidence: number): Promise<boolean> {
    await this.sendCommand(`AT+CONFIDENCE=${confidence}\r\n`, 1000);
    return true;
  }

  public async getConfidence(): Promise<number> {
    await this.sendCommand('AT+CONFIDENCE?\r\n', 1000);
    const cmd = this.response.split(':')[0];
    const value = this.response.split(':')[1];
    if (cmd === 'CONFIDENCE' && value !== undefined) {
      return new Number(value.trim()).valueOf();
    }
    return 0;
  }

  public async setIOU(iou: number): Promise<boolean> {
    await this.sendCommand(`AT+IOU=${iou}\r\n`, 1000);
    return true;
  }

  public async getIOU(): Promise<number> {
    await this.sendCommand('AT+IOU?\r\n', 1000);
    const cmd = this.response.split(':')[0];
    const value = this.response.split(':')[1];
    if (cmd === 'IOU' && value !== undefined) {
      return new Number(value.trim()).valueOf();
    }
    return 0;
  }

  public async reset(): Promise<boolean> {
    await this.sendCommand('AT+RESET\r\n', 1000);
    return true;
  }

  public async saveConfig(): Promise<boolean> {
    await this.sendCommand('AT+SAVE\r\n', 1000);
    return true;
  }

  public async clearConfig(): Promise<boolean> {
    await this.sendCommand('AT+CLEAR\r\n', 1000);
    return true;
  }

  public async invoke(): Promise<boolean> {
    await this.sendCommand('AT+INVOKE\r\n', 1000);
    return true;
  }

  private async sendCommand(command: string, timeout: number): Promise<void> {
    this.ack = false;
    this.response = '';
    await this.port.write(this.textEncoder.encode(command));
    const start = new Date().getTime();
    return new Promise<void>((resolve) => {
      const intervalId = setInterval(() => {
        if (this.ack || new Date().getTime() - start > timeout) {
          clearInterval(intervalId);
          resolve(); 
        }
      }, 10);
    });
  }
}

export default ATClientV1;
