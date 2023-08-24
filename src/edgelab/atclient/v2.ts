import { ATClient } from './atclient';
import { Pointer } from '../types';

const JPEG_MAGIC = 0x2b2d2b2d;
const TEXT_MAGIC = 0x0f100e12;

export const ERROR_LIST = [
  'Success',
  'Model Invalid Or Not Existent',
  'Model Parsing Failure',
  'Memory Allocation Failure',
  'Pre-processed Data Failure',
  'Post-processed Data Failure',
  'Algorithm Initialization Failure',
  'Algorithm Mismatch With the Model',
  'Algorithm Parameter Invalid',
  'Algorithm Invoke Failure',
  'Algorithm Get Results Failure',
  'Sensor Not Supported Yet',
  'Sensor Parameter Invalid',
  'Camera Initialization Failure',
  'Camera De-Initialization Failure',
  'Camera Parameter Invalid',
  'IMU Initialization Failure',
  'Watchdog Timeout',
  'Command CRC checksum error',
  'Unknown Error',
];

export class ATClientV2 extends ATClient {
  constructor() {
    super('v2');
  }

  public getID(): string {
    return 'AT+ID?\r\n';
  }

  public getVersion(): string {
    return 'AT+VER?\r\n';
  }

  public getName(): string {
    return 'AT+NAME?\r\n';
  }

  public getError(): string {
    return 'AT+ERR?\r\n';
  }

  public setModel(model: string): string {
    return `AT+MODEL=${model}\r\n`;
  }

  public getModel(): string {
    return 'AT+MODEL?\r\n';
  }

  public getModelList(): string {
    return 'AT+VMODEL?\r\n';
  }

  public setAlgorithm(algorithm: string): string {
    return `AT+ALGO=${algorithm}\r\n`;
  }

  public getAlgorithm(): string {
    return 'AT+ALGO?\r\n';
  }

  public getAlgorithmList(): string {
    return 'AT+VALGO?\r\n';
  }

  public setConfidence(confidence: number): string {
    return `AT+CONF=${confidence}\r\n`;
  }

  public getConfidence(): string {
    return 'AT+CONF?\r\n';
  }

  public setIOU(iou: number): string {
    return `AT+IOU=${iou}\r\n`;
  }

  public getIOU(): string {
    return 'AT+IOU?\r\n';
  }

  public reset(): string {
    return 'AT+RST\r\n';
  }

  public saveConfig(): string {
    return 'AT+SAVE\r\n';
  }

  public clearConfig(): string {
    return 'AT+CLEAR\r\n';
  }

  public invoke(times: number): string {
    return `AT+INVOKE=${times}\r\n`;
  }

  public getInvoke(): string {
    return 'AT+INVOKE?\r\n';
  }

  public getRotate(): string {
    return 'AT+CFG\r\n';
  }

  public getPointer(): string {
    return 'AT+POINT?\r\n';
  }

  public setPointer(pointer: Pointer): string {
    return `AT+POINT=${pointer.startX},${pointer.startY},${pointer.endX},${
      pointer.endY
    },${pointer.centerX},${pointer.centerY},${pointer.from * 1000},${
      pointer.to * 1000
    }\r\n`;
  }
}

export default ATClientV2;
