import { Terminal } from 'xterm';
import Himax from './deviceHimax';
import Device from '../device';
import DeviceManagerInterface from '../DeviceManagerInterface';

class DeviceManager implements DeviceManagerInterface {
  private device: Device | null;
  private term: Terminal;

  public getTerminal(): Terminal {
    return this.term;
  }

  constructor() {
    this.device = new Himax();
    this.term = new Terminal({ cols: 78, rows: 30 });
  }

  getDevice<Himax>(): Himax {
    return this.device as Himax;
  }

  getTerm(): Terminal {
    return this.term;
  }
}

export default new DeviceManager();
