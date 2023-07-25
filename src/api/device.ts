import { ATClientV2 } from './atclient/v2';
import { Serial, getSerials, requestSerial } from './serial';
import { WebUSB, getWebUSBs, requestWebUSB } from './webusb';

export const PROTOCOL_LIST = [
  {
    value: 'webusb',
    label: 'WebUSB',
  },
  {
    value: 'serial',
    label: 'Serial',
  },
];

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
  }

  public async mount(): Promise<void> {
    if (this.protocol === 'webusb') {
      getWebUSBs().then((ports: WebUSB[]) => {
        if (ports.length > 0) {
          [this.port] = ports;
          this.connect();
        }
      });
    } else if (this.protocol === 'serial') {
      getSerials().then((ports: Serial[]) => {
        if (ports.length > 0) {
          [this.port] = ports;
          this.connect();
        }
      });
    }
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
        this.connected = true;
        this.port.onReceiveError = this.onReceiveError.bind(this);
        this.client = new ATClientV2(this.port);
        this.client.onLogger = this.onLogger;
        this.client.onMonitor = this.onMonitor;
        this.client.onPreview = this.onPreview;
        if (this.onConnected !== null) {
          this.onConnected();
        }
      });
    }
  }

  private onReceiveError(error: any) {
    this.connected = false;
    this.port = null;
    this.client = null;
    if (this.onDisconnected !== null) {
      this.onDisconnected();
    }
    console.log(error);
  }

  public async disconnect(): Promise<void> {
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
        console.log(error);
      });
  }
}
