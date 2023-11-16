import { Terminal } from 'xterm';
import Serial from './serial';
import Device from '../device';
import DeviceManagerInterface from '../DeviceManagerInterface';

class DeviceManager implements DeviceManagerInterface {
  private device: Device;
  private term: Terminal;

  constructor() {
    this.device = new Serial();
    this.term = new Terminal({ cols: 78, rows: 30 });
  }

  getDevice(): Device {
    return this.device;
  }

  getTerm(): Terminal {
    return this.term;
  }
}

export default new DeviceManager();
