import { Terminal } from 'xterm';
import Device from './device';

export default interface DeviceManagerInterface {
  getDevice(): Device;
  getTerm(): Terminal;
}
