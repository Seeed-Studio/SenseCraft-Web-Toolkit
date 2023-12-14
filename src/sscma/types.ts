export enum DeviceStatus {
  UnConnected = 0, // 设备串口未连接
  SerialConnected = 1, // 串口连接状态，可以下发指令
  EspConnected = 2, // esp连接状态，可以烧录固件和模型
  Flashing = 3, // 烧录状态，不能做别的操作
}

export interface Bin {
  name: string;
  url: string;
  address: number;
  checksum: string;
  size: string;
}

export interface Firmware {
  name: string;
  description: string;
  image: string;
  version: string;
  bins: Bin[];
  model_slots: {
    address: number;
  }[];
}

export interface Model {
  uuid?: string;
  name: string;
  version: string;
  category: string;
  classes: string[];
  model_type?: string;
  algorithm?: string;
  description?: string;
  image?: string;
  devices?: string[];
  url?: string;
  checksum?: string;
  size: string;
  author?: string;
  isCustom?: boolean;
  modelImg?: string;
}

export enum AlgoType {
  UNDEFINED = 0,
  FOMO = 1,
  PFLD = 2,
  YOLO = 3,
  IMCLS = 4,
}

export enum AlgoCategory {
  UNDEFINED = 0,
  DETECTION = 1,
  RECOGNITION = 2,
  CLASSIFICATION = 3,
}

export interface Algo {
  type: AlgoType;
  categroy: AlgoCategory;
  input_from: string;
}

export enum SensorType {
  UNDEFINED = 0,
  Camera = 1,
}

export enum SensorState {
  UNKNOWN = 0,
  REGISTERED = 1,
  AVAILABLE = 2,
  LOCKED = 3,
}

export interface Sensor {
  id: string;
  type: SensorType;
  state: SensorState;
}
