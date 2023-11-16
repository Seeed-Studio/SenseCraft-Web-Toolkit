import { Terminal } from 'xterm';
import EspSerialDevice from './EspSerialDevice';
import DeviceManagerInterface from '../DeviceManagerInterface';

class DeviceManager implements DeviceManagerInterface {
  private device: EspSerialDevice;
  private term: Terminal;

  constructor() {
    this.device = new EspSerialDevice();
    this.term = new Terminal({ cols: 78, rows: 30 });
  }

  getDevice<EspSerialDevice>(): EspSerialDevice {
    return this.device as EspSerialDevice;
  }

  getTerm(): Terminal {
    return this.term;
  }
}

export default new DeviceManager();
