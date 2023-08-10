import { Notification } from '@arco-design/web-vue';
import { ATClientV2 } from './atclient/v2';
import { Serial, getSerials, requestSerial } from './serial';
import { WebUSB, getWebUSBs, requestWebUSB } from './webusb';
import { Pointer, Config } from './types';
import { EVENT } from './enums';

export default class Device {
  public port: Serial | WebUSB | null;

  public client: any;

  public protocol: string;

  public connected: boolean;

  public onLogger: any;

  public onMonitor: any;

  public onPreview: any;

  public onConnected: any;

  public onDisconnected: any;

  public config: Config;

  public event: number;

  constructor() {
    this.protocol = localStorage.getItem('protocol') || 'webusb';
    this.port = null;
    this.client = null;
    this.connected = false;
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
  }

  public async mount(): Promise<boolean> {
    this.port = null;
    if (this.protocol === 'webusb') {
      const ports = await getWebUSBs();
      if (ports.length > 0) {
        [this.port] = ports;
        this.connect();
      }
    } else if (this.protocol === 'serial') {
      const ports = await getSerials();
      if (ports.length > 0) {
        [this.port] = ports;
        this.connect();
      }
    }
    return this.port !== null;
  }

  public async setEvent(event: number): Promise<void> {
    this.event |= event;
  }

  public async clearEvent(event: number): Promise<void> {
    this.event &= ~event;
  }

  public getEvent(): number {
    return this.event;
  }

  public async requestDevice(protocol: string | null): Promise<any> {
    if (protocol !== null) {
      this.protocol = protocol;
    }
    this.port = null;
    if (this.protocol === 'webusb') {
      this.port = await requestWebUSB();
    } else if (this.protocol === 'serial') {
      this.port = await requestSerial();
    }
    return this.port;
  }

  public async connect(): Promise<void> {
    localStorage.setItem('protocol', this.protocol);
    if (this.port !== null) {
      await this.port.connect().then(() => {
        if (this.port === null) {
          return Promise.resolve();
        }
        this.port.onReceiveError = this.onReceiveError.bind(this);
        this.client = new ATClientV2(this.port);
        this.client.onLogger = this.onLogger;
        this.client.onMonitor = this.onMonitor;
        this.client.onPreview = this.onPreview;
        if (this.onConnected !== null) {
          this.onConnected();
        }
        setTimeout(() => {
          this.client.flush();
          const err = this.client.getError();
          if (err === null) {
            this.onReceiveError(err);
          }
          this.connected = true;
        }, 1000);
        return Promise.resolve();
      });
    }
  }

  public onReceiveError(error: any) {
    this.connected = false;
    this.port = null;
    this.client = null;
    if (this.onDisconnected !== null) {
      this.onDisconnected();
    }
    Notification.error({
      title: 'Error',
      content: 'Device disconnected',
    });
    console.error(error);
  }

  public async disconnect(): Promise<void> {
    if (this.port === null) {
      return;
    }
    this.port.onReceive = () => {};
    this.port.onReceiveError = () => {};
    await this.port
      .disconnect()
      .then(() => {
        this.connected = false;
        this.port = null;
        this.client = null;
        if (this.onDisconnected !== null) {
          this.onDisconnected();
        }
      })
      .catch((error: any) => {
        Notification.error({
          title: 'Error',
          content: error,
        });
      });
  }

  public async getID(): Promise<string> {
    return this.client.getID();
  }

  public async getVersion(): Promise<string> {
    return this.client.getVersion();
  }

  public async getName(): Promise<string> {
    return this.client.getName();
  }

  public async getError(): Promise<string> {
    return this.client.getError();
  }

  public async setModel(model: string): Promise<boolean> {
    this.config.model = model;
    return this.client.setModel(model);
  }

  public async getModel(): Promise<string> {
    this.config.model = await this.client.getModel();
    return this.config.model;
  }

  public async getModelList(): Promise<any[]> {
    return this.client.getModelList();
  }

  public async getAlgorithm(): Promise<string> {
    this.config.algorithm = await this.client.getAlgorithm();
    return this.config.algorithm;
  }

  public async setAlgorithm(algorithm: string): Promise<boolean> {
    this.config.algorithm = algorithm;
    return this.client.setAlgorithm(algorithm);
  }

  public async getAlgorithmList(): Promise<any[]> {
    return this.client.getAlgorithmList();
  }

  public async getConfidence(): Promise<number> {
    this.config.confidence = await this.client.getConfidence();
    return this.config.confidence;
  }

  public async setConfidence(confidence: number): Promise<boolean> {
    this.config.confidence = confidence;
    return this.client.setConfidence(confidence);
  }

  public async getIOU(): Promise<number> {
    this.config.iou = await this.client.getIOU();
    return this.config.iou;
  }

  public async setIOU(iou: number): Promise<boolean> {
    this.config.iou = iou;
    return this.client.setIOU(iou);
  }

  public async reset(): Promise<boolean> {
    return this.client.reset();
  }

  public async saveConfig(): Promise<boolean> {
    return this.client.saveConfig();
  }

  public async clearConfig(): Promise<boolean> {
    return this.client.clearConfig();
  }

  public async invoke(times: number): Promise<boolean> {
    this.config.invoke = times;
    return this.client.invoke(times);
  }

  public async getRotate(): Promise<number> {
    this.config.rotate = await this.client.getRotate();
    return this.config.rotate;
  }

  public async getInvoke(): Promise<number> {
    this.config.invoke = await this.client.getInvoke();
    return this.config.invoke;
  }

  public async getPointer(): Promise<Pointer> {
    this.config.pointer = await this.client.getPointer();
    return this.config.pointer;
  }

  public async setPointer(pointer: Pointer): Promise<boolean> {
    this.config.pointer = pointer;
    return this.client.setPointer(pointer);
  }
}
