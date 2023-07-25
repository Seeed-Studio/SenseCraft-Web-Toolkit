import { ATClient } from './atclient';

const JPEG_MAGIC = 0x2b2d2b2d;
const TEXT_MAGIC = 0x0f100e12;

export class ATClientV2 extends ATClient {
  public port: any;

  private textEncoder = new TextEncoder();

  private textDecoder = new TextDecoder();

  private response: string;

  private ack: boolean;

  private idle: boolean;

  private status: number;

  private recv_size: number;

  private execpt_size: number;

  private data_buffer: Uint8Array;

  public onMonitor: any;

  public onLogger: any;

  public onPreview: any;

  constructor(port: any) {
    super('v1');
    this.port = port;
    this.response = '';
    this.ack = false;
    this.idle = true;
    this.recv_size = 0;
    this.execpt_size = 0;
    this.data_buffer = new Uint8Array(0);
    this.textDecoder = new TextDecoder();
    this.textEncoder = new TextEncoder();
    this.status = 0; // 0: idle, 1: invoke, 2: logger
    this.onMonitor = null;
    this.onLogger = null;
    this.onPreview = null;
    this.port.onReceive = this.handleReceive.bind(this);
  }

  private handleReceive(data: any) {
    // const buffer = new Uint8Array(this.data_buffer.length + data.length);
    // buffer.set(this.data_buffer);
    // buffer.set(new Uint8Array(data.buffer), this.data_buffer.length);
    // this.data_buffer = buffer;
    // const str = this.textDecoder.decode(this.data_buffer);
    // if (str.includes('}')) {
    //   this.data_buffer = new Uint8Array(0);
    //   try {
    //     const obj = JSON.parse(str);
    //     if (obj.type === 'AT') {
    //       this.response = obj.data.trim();
    //       this.ack = true;
    //     } else if (obj.type === 'log') {
    //       if (this.onLogger !== null) this.onLogger(obj);
    //     } else if (obj.type === 'preview') {
    //       // if (this.onMonitor !== null) this.onMonitor(obj.data, obj.width);
    //       console.log(obj);
    //       this.ack = true;
    //     }
    //   } catch (e) {
    //     console.log(e);
    //   }
    // }
    if (
      data.byteLength === 8 &&
      (data.getUint32(0) === JPEG_MAGIC || data.getUint32(0) === TEXT_MAGIC)
    ) {
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
        if (this.onMonitor !== null) this.onMonitor(binaryString);
      } else if (this.status === 2) {
        const str = this.textDecoder
          .decode(this.data_buffer)
          .replace(/\r|\n/g, '');
        try {
          const obj = JSON.parse(str);
          if (obj.type === 'AT') {
            this.response = obj.data.trim();
            this.ack = true;
          } else if (obj.type === 'log') {
            if (this.onLogger !== null) this.onLogger(str);
          } else if (obj.type === 'preview') {
            if (this.onPreview !== null) this.onPreview(str);
            this.ack = true;
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
  }

  public async getID(): Promise<string> {
    const response = await this.sendCommand('AT+ID?\r\n', 2000);
    return response;
  }

  public async getVersion(): Promise<string> {
    const response = await this.sendCommand('AT+VER?\r\n', 2000);
    return response;
  }

  public async getName(): Promise<string> {
    const response = await this.sendCommand('AT+NAME?\r\n', 2000);
    return response;
  }

  public async setModel(model: string): Promise<boolean> {
    const response = await this.sendCommand(`AT+MODEL=${model}\r\n`, 2000);
    if (response === 'OK') {
      return true;
    }
    return false;
  }

  public async getModel(): Promise<string> {
    const response = await this.sendCommand('AT+MODEL?\r\n', 2000);
    return response;
  }

  public async getModelList(): Promise<any[]> {
    const response = await this.sendCommand('AT+VMODEL?\r\n', 2000);
    const models = response.split(',');
    const result = [];
    for (let i = 0; i < models.length - 1; i += 1) {
      const model = models[i];
      result.push({
        value: model,
        label: `workplace.config.model.${model}`,
      });
    }
    return result;
  }

  public async setAlgorithm(algorithm: string): Promise<boolean> {
    const response = await this.sendCommand(`AT+ALGO=${algorithm}\r\n`, 2000);
    if (response === 'OK') {
      return true;
    }
    return false;
  }

  public async getAlgorithm(): Promise<string> {
    const response = await this.sendCommand('AT+ALGO?\r\n', 2000);
    return response;
  }

  public async getAlgorithmList(): Promise<any[]> {
    const response = await this.sendCommand('AT+VALGO?\r\n', 2000);
    const algos = response.split(',');
    const result = [];
    for (let i = 0; i < algos.length - 1; i += 1) {
      const algo = algos[i];
      result.push({
        value: algo,
        label: `workplace.config.algorithm.${algo}`,
      });
    }
    return result;
  }

  public async setConfidence(confidence: number): Promise<boolean> {
    const response = await this.sendCommand(`AT+CONF=${confidence}\r\n`, 2000);
    if (response === 'OK') {
      return true;
    }
    return false;
  }

  public async getConfidence(): Promise<number> {
    const response = await this.sendCommand('AT+CONF?\r\n', 2000);
    return parseInt(response, 10);
  }

  public async setIOU(iou: number): Promise<boolean> {
    const response = await this.sendCommand(`AT+IOU=${iou}\r\n`, 2000);
    if (response === 'OK') {
      return true;
    }
    return false;
  }

  public async getIOU(): Promise<number> {
    const response = await this.sendCommand('AT+IOU?\r\n', 2000);
    return parseInt(response, 10);
  }

  public async reset(): Promise<boolean> {
    await this.sendCommand('AT+RST\r\n', 2000);
    return true;
  }

  public async saveConfig(): Promise<boolean> {
    const response = await this.sendCommand('AT+SAVE\r\n', 2000);
    if (response === 'OK') {
      return true;
    }
    return false;
  }

  public async clearConfig(): Promise<boolean> {
    const response = await this.sendCommand('AT+CLEAR\r\n', 2000);
    if (response === 'OK') {
      return true;
    }
    return false;
  }

  public async invoke(times: number): Promise<boolean> {
    const response = await this.sendCommand(`AT+INVOKE=${times}\r\n`, 3000);
    if (response === 'OK') {
      return true;
    }
    return false;
  }

  public async getRotate(): Promise<number> {
    const response = await this.sendCommand('AT+CFG\r\n', 2000);
    return (4 - parseInt(response, 10)) * 90;
  }

  private waitAck(timeout: number): Promise<boolean> {
    const start = new Date().getTime();
    return new Promise<boolean>((resolve) => {
      const intervalId = setInterval(() => {
        if (this.ack) {
          clearInterval(intervalId);
          resolve(true);
        }
        if (new Date().getTime() - start > timeout) {
          clearInterval(intervalId);
          resolve(false);
        }
      }, 10);
    });
  }

  private waitIdle(timeout: number): Promise<boolean> {
    const start = new Date().getTime();
    return new Promise<boolean>((resolve) => {
      const intervalId = setInterval(() => {
        if (this.idle) {
          clearInterval(intervalId);
          resolve(true);
        }
        if (new Date().getTime() - start > timeout) {
          clearInterval(intervalId);
          resolve(false);
        }
      }, 10);
    });
  }

  private async sendCommand(command: string, timeout: number): Promise<string> {
    if (!(await this.waitIdle(timeout))) {
      return '';
    }
    this.idle = false;
    this.response = '';
    this.ack = false;
    await this.port.write(this.textEncoder.encode(command));
    if (!(await this.waitAck(timeout))) {
      this.idle = true;
      return '';
    }
    this.idle = true;
    return this.response;
  }
}

export default ATClientV2;
