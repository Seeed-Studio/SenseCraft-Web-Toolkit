import { Terminal } from 'xterm';
import Himax from './deviceHimax';
import Device from './device';

class DeviceManager {
  private device: Device;
  private term: Terminal;

  public getDevice(): Device {
    return this.device;
  }

  public async requestDevice(): Promise<Device> {
    if (this.device !== null) {
      await this.device.disconnect();
    }
    const port = await navigator.serial.requestPort();
    this.device = new Himax(port);
    return this.device;
  }

  public getTerminal(): Terminal {
    return this.term;
  }

  constructor() {
    this.device = null;
    this.term = new Terminal({ cols: 78, rows: 30 });
  }
}

export default new DeviceManager();
