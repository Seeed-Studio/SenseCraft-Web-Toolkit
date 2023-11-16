import { Terminal } from 'xterm';
import Device from './device';

export default interface DeviceManagerInterface {
  getDevice<T extends Device>(): T;
  getTerm(): Terminal;
}
