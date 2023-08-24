import { Notification } from '@arco-design/web-vue';
import { useDeviceStore } from '@/store';
import { ATClientV2, ERROR_LIST } from './atclient/v2';
import { Pointer, Config } from './types';
import { EVENT } from './enums';

export default class Device {
  public deviceStore;

  public port: SerialPort | USBDevice | null;

  public client: ATClientV2;

  public protocol: string;

  public onLogger: any;

  public onMonitor: any;

  public onPreview: any;

  public onConnected: any;

  public onDisconnected: any;

  public onReceive: any;

  public config: Config;

  public event: number;

  public data_buffer: Uint8Array;

  public textEncoder: TextEncoder;

  public textDecoder: TextDecoder;

  public response: string;

  public ack: boolean;

  private idle: boolean;

  constructor() {
    this.protocol = localStorage.getItem('protocol') || 'serial';
    this.port = null;
    this.deviceStore = useDeviceStore();
    // this.port = null;
    this.client = new ATClientV2();
    // this.connected = false;
    this.onLogger = null;
    this.onMonitor = null;
    this.onPreview = null;
    this.onConnected = null;
    this.onDisconnected = null;
    this.event = EVENT.NONE;
    this.config = {
      model: '0',
      algorithm: '2',
      confidence: 0.3,
      iou: 0.4,
      invoke: 0,
      rotate: 0,
      pointer: {
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        centerX: 0,
        centerY: 0,
        from: 0,
        to: 0,
      },
    };
    this.data_buffer = new Uint8Array(0);
    this.textDecoder = new TextDecoder();
    this.textEncoder = new TextEncoder();
    this.response = '';
    this.ack = false;
    this.idle = true;
  }

  public handleReceive(data: any) {}

  public async setEvent(event: number): Promise<void> {
    this.event |= event;
  }

  public async clearEvent(event: number): Promise<void> {
    this.event &= ~event;
  }

  public getEvent(): number {
    return this.event;
  }

  public onReceiveError(error: any) {
    // this.client = null;
    if (this.onDisconnected !== null) {
      this.onDisconnected();
    }
    Notification.error({
      title: 'Error',
      content: 'Device disconnected',
    });
    console.log(error);
  }

  public async connect() {}

  public disconnect() {}

  public async write(data: BufferSource) {}

  public async flush() {
    await this.write(this.textEncoder.encode('\r\n'));
    await this.write(this.textEncoder.encode('\r\n'));
    await this.write(this.textEncoder.encode('\r\n'));
  }

  public waitAck(timeout: number): Promise<boolean> {
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

  public waitIdle(timeout: number): Promise<boolean> {
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

  public async sendCommand(command: string | undefined, timeout: number) {
    if (!command) {
      return '';
    }
    if (!(await this.waitIdle(timeout * 2))) {
      return '';
    }
    console.log(`send: ${command}`);
    this.idle = false;
    this.response = '';
    this.ack = false;
    await this.write(this.textEncoder.encode(command));

    if (!(await this.waitAck(timeout))) {
      this.idle = true;
      console.log('ack timeout');
      return '';
    }
    this.idle = true;
    console.log(`response: ${this.response}`);
    return this.response;
  }

  public async getID(): Promise<string> {
    const command = this.client.getID();
    const response = await this.sendCommand(command, 500);
    return response;
  }

  public async getVersion(): Promise<string> {
    const command = this.client.getVersion();
    const response = await this.sendCommand(command, 500);
    return response;
  }

  public async getName(): Promise<string> {
    const command = this.client.getName();
    const response = await this.sendCommand(command, 500);
    return response;
  }

  public async getError(): Promise<string> {
    const command = this.client.getError();
    const response = await this.sendCommand(command, 500);
    return ERROR_LIST[parseInt(response, 10)];
  }

  public async setModel(model: string): Promise<boolean> {
    const command = this.client.setModel(model);
    const response = await this.sendCommand(command, 500);
    const ret = response === 'OK';
    if (ret) {
      this.config.model = model;
    }
    return ret;
  }

  public async getModel(): Promise<string> {
    const command = this.client.getModel();
    const response = await this.sendCommand(command, 500);
    this.config.model = response;
    return this.config.model;
  }

  public async getModelList(): Promise<any[]> {
    const command = this.client.getModelList();
    const response = await this.sendCommand(command, 500);
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
    const command = this.client.setAlgorithm(algorithm);
    const response = await this.sendCommand(command, 500);
    const ret = response === 'OK';
    if (ret) {
      this.config.algorithm = algorithm;
    }
    return ret;
  }

  public async getAlgorithm(): Promise<string> {
    const command = this.client.getAlgorithm();
    const response = await this.sendCommand(command, 500);
    return response;
  }

  public async getAlgorithmList(): Promise<any[]> {
    const command = this.client.getAlgorithmList();
    const response = await this.sendCommand(command, 500);
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
    const command = this.client.setConfidence(confidence);
    const response = await this.sendCommand(command, 500);
    const ret = response === 'OK';
    if (ret) {
      this.config.confidence = confidence;
    }
    return ret;
  }

  public async getConfidence(): Promise<number> {
    const command = this.client.getConfidence();
    const response = await this.sendCommand(command, 500);
    this.config.confidence = parseInt(response, 10);
    return this.config.confidence;
  }

  public async setIOU(iou: number): Promise<boolean> {
    const command = this.client.setIOU(iou);
    const response = await this.sendCommand(command, 500);
    const ret = response === 'OK';
    if (ret) {
      this.config.iou = iou;
    }
    return ret;
  }

  public async getIOU(): Promise<number> {
    const command = this.client.getIOU();
    const response = await this.sendCommand(command, 500);
    this.config.iou = parseInt(response, 10);
    return this.config.iou;
  }

  public async reset() {
    const command = this.client.reset();
    const response = await this.sendCommand(command, 3000);
    return response;
  }

  public async saveConfig(): Promise<boolean> {
    const command = this.client.saveConfig();
    const response = await this.sendCommand(command, 500);
    return response === 'OK';
  }

  public async clearConfig(): Promise<boolean> {
    const command = this.client.clearConfig();
    const response = await this.sendCommand(command, 500);
    return response === 'OK';
  }

  public async invoke(times: number): Promise<boolean> {
    const command = this.client.invoke(times);
    const response = await this.sendCommand(command, 3000);
    const ret = response === 'OK';
    if (ret) {
      this.config.invoke = times;
    }
    return ret;
  }

  public async getInvoke(): Promise<number> {
    const command = this.client.getInvoke();
    const response = await this.sendCommand(command, 500);
    this.config.invoke = parseInt(response, 10);
    return this.config.invoke;
  }

  public async getRotate(): Promise<number> {
    const command = this.client.getRotate();
    const response = await this.sendCommand(command, 500);
    this.config.rotate = (4 - parseInt(response, 10)) * 90;
    return this.config.rotate;
  }

  public async setPointer(pointer: Pointer): Promise<boolean> {
    const command = this.client.setPointer(pointer);
    const response = await this.sendCommand(command, 500);
    const ret = response === 'OK';
    if (ret) {
      this.config.pointer = pointer;
    }
    return ret;
  }

  public async getPointer(): Promise<Pointer> {
    const command = this.client.getPointer();
    const response = await this.sendCommand(command, 500);
    const data = response.split(',');
    const pointer: Pointer = {
      startX: parseInt(data[0], 10),
      startY: parseInt(data[1], 10),
      endX: parseInt(data[2], 10),
      endY: parseInt(data[3], 10),
      centerX: parseInt(data[4], 10),
      centerY: parseInt(data[5], 10),
      from: parseInt(data[6], 10) / 1000,
      to: parseInt(data[7], 10) / 1000,
    };
    this.config.pointer = pointer;
    return this.config.pointer;
  }
}
