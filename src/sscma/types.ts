export enum DeviceStatus {
  UnConnected = 0,
  SerialConnected = 1,
  FlasherConnected = 3,
  Flashing = 4,
  Connected,
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
  url?: string;
  checksum?: string;
  size: string;
  isCustom?: boolean;
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
