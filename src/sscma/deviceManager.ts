import { Terminal } from 'xterm';
import Serial from './serial';
import Device from './device';

class DeviceManager {
  public device: Device;
  public term: Terminal;

  constructor() {
    this.device = new Serial();
    this.term = new Terminal({ cols: 78, rows: 30 });
  }
}

export default new DeviceManager();
