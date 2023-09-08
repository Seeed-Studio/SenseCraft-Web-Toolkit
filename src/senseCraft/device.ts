import { useDeviceStore } from '@/store';
import { ATClient, ERROR_LIST } from './atclient';
import { Algo } from './types';

export default class Device {

  public deviceStore;

  public port: SerialPort | USBDevice | null;

  public client: ATClient;

  public textEncoder: TextEncoder;

  public textDecoder: TextDecoder;

  public resolveMap: Map<string, (value: unknown) => void>;
  public rejectMap: Map<string, (value: unknown) => void>;
  public timeoutMap: Map<string, NodeJS.Timeout>;
  public eventMap: Map<string, (event: any) => void>;

  constructor() {
    this.port = null;
    this.deviceStore = useDeviceStore();
    this.client = new ATClient();

    this.textDecoder = new TextDecoder();
    this.textEncoder = new TextEncoder();

    this.resolveMap = new Map();
    this.rejectMap = new Map();
    this.timeoutMap = new Map();
    this.eventMap = new Map();
  }

  public addEventListener(type: string, listener: (event: any) => any) {
    this.eventMap.set(type, listener)
  }

  public removeEventListener(type: string) {
    this.eventMap.delete(type)
  }

  public handleReceive(data: any) {

  }

  public async connect() { }

  public disconnect() { }

  public async write(data: BufferSource) { }

  public async flush() {
    await this.write(this.textEncoder.encode('\r\n'));
    await this.write(this.textEncoder.encode('\r\n'));
    await this.write(this.textEncoder.encode('\r\n'));
  }

  public async sendCommand(command: string | undefined, tag: string, timeout = 5000): Promise<any> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      if (!command) {
        reject(new Error('invalid parameter'));
        return
      }
      const timer = setTimeout(() => {
        reject(new Error('timeout'));
        this.resolveMap.delete(tag)
        this.rejectMap.delete(tag)
        this.timeoutMap.delete(tag);
      }, timeout);

      this.timeoutMap.set(tag, timer)
      this.resolveMap.set(tag, resolve)
      this.rejectMap.set(tag, reject)

      await this.write(this.textEncoder.encode(command));
    })
  }

  public deleteMap(tag: string) {
    this.resolveMap.delete(tag);
    this.rejectMap.delete(tag);
    const timeout = this.timeoutMap.get(tag)
    if (timeout) {
      clearTimeout(timeout)
      this.timeoutMap.delete(tag);
    }
  }

  public async getID(): Promise<string> {
    try {
      const tag = 'ID?';
      const command = this.client.getID();
      const response = await this.sendCommand(command, tag);
      const code = response.code as (keyof typeof ERROR_LIST);
      const errorMsg = ERROR_LIST[code] || 'unknown code';
      this.deleteMap(tag);
      if (code === 0) {
        const data = response.data
        return data;
      }
      return `code[${code}]:${errorMsg}`;
    } catch (error) {
      return ''
    }
  }

  public async getName(): Promise<string> {
    try {
      const tag = 'NAME?';
      const command = this.client.getName();
      const response = await this.sendCommand(command, tag);
      const code = response.code as (keyof typeof ERROR_LIST);
      this.deleteMap(tag);
      if (code === 0) {
        const data = response.data
        return data;
      }
      return '';
    } catch (error) {
      return ''
    }
  }

  public async getStat(): Promise<string | object> {
    try {
      const tag = 'STAT?';
      const command = this.client.getStat();
      const response = await this.sendCommand(command, tag);
      const code = response.code as (keyof typeof ERROR_LIST);
      const errorMsg = ERROR_LIST[code] || 'unknown code';
      this.deleteMap(tag);
      if (code === 0) {
        const data = response.data
        return data;
      }
      return `code[${code}]:${errorMsg}`;
    } catch (error) {
      return 'error'
    }
  }

  public async getVersion(): Promise<string> {
    try {
      const tag = 'VER?';
      const command = this.client.getVersion();
      const response = await this.sendCommand(command, tag);
      const code = response.code as (keyof typeof ERROR_LIST);
      this.deleteMap(tag);
      if (code === 0) {
        const data = response.data
        if (data?.software) {
          return data.software
        }
        return 'unknown';
      }
      return '';
    } catch (error) {
      return ''
    }
  }

  public async getAlgorithms(): Promise<Algo[]> {
    try {
      const tag = 'ALGOS?';
      const command = this.client.getAlgorithms();
      const response = await this.sendCommand(command, tag);
      const code = response.code;
      this.deleteMap(tag);
      if (code === 0) {
        const data = response.data as Algo[]
        return data;
      }
      return []
    } catch (error) {
      return []
    }
  }

  public async getModels(): Promise<any> {
    try {
      const tag = 'MODELS?';
      const command = this.client.getModels();
      const response = await this.sendCommand(command, tag);
      const code = response.code;
      this.deleteMap(tag);
      if (code === 0) {
        const data = response.data
        return data;
      }
      return []
    } catch (error) {
      return []
    }
  }

  public async getModel(): Promise<any> {
    try {
      const tag = 'MODEL?';
      const command = this.client.getModel();
      const response = await this.sendCommand(command, tag);
      const code = response.code;
      this.deleteMap(tag);
      if (code === 0) {
        const data = response.data
        return data;
      }
      return null
    } catch (error) {
      return error
    }
  }

  public async getSensors(): Promise<any> {
    try {
      const tag = 'SENSORS?';
      const command = this.client.getSensors();
      const response = await this.sendCommand(command, tag);
      const code = response.code as (keyof typeof ERROR_LIST);
      const errorMsg = ERROR_LIST[code] || 'unknown code';
      this.deleteMap(tag);
      if (code === 0) {
        const data = response.data
        return data;
      }
      return `code[${code}]:${errorMsg}`;
    } catch (error) {
      return error
    }
  }

  public async getSensor(): Promise<any> {
    try {
      const tag = 'SENSOR?';
      const command = this.client.getSensor();
      const response = await this.sendCommand(command, tag);
      const code = response.code;
      this.deleteMap(tag);
      if (code === 0) {
        const data = response.data
        return data;
      }
      return null
    } catch (error) {
      return error
    }
  }

  public async isSample(): Promise<boolean> {
    try {
      const tag = 'SAMPLE?';
      const command = this.client.getSampleState();
      const response = await this.sendCommand(command, tag);
      const code = response.code;
      this.deleteMap(tag);
      if (code === 0) {
        return response.data === 1
      }
      return false
    } catch (error) {
      return false
    }
  }

  public async isInvoke(): Promise<boolean> {
    try {
      const tag = 'INVOKE?';
      const command = this.client.getInvokeState();
      const response = await this.sendCommand(command, tag);
      const code = response.code;
      this.deleteMap(tag);
      if (code === 0) {
        return response.data === 1
      }
      return false
    } catch (error) {
      return false
    }
  }

  public async getInfo(): Promise<any> {
    try {
      const tag = 'INFO?';
      const command = this.client.getInfo();
      const response = await this.sendCommand(command, tag);
      const code = response.code;
      this.deleteMap(tag);
      if (code === 0 && response.data) {
        return response.data.info;
      }
      return null
    } catch (error) {
      return null
    }
  }

  public async getScore(): Promise<string> {
    try {
      const tag = 'TSCORE?';
      const command = this.client.getScore();
      const response = await this.sendCommand(command, tag);
      const code = response.code as (keyof typeof ERROR_LIST);
      const errorMsg = ERROR_LIST[code] || 'unknown code';
      this.deleteMap(tag);
      if (code === 0) {
        const data = response.data
        return data;
      }
      return `code[${code}]:${errorMsg}`;
    } catch (error) {
      return 'error'
    }
  }

  public async getIOU(): Promise<string> {
    try {
      const tag = 'TIOU?';
      const command = this.client.getIOU();
      const response = await this.sendCommand(command, tag);
      const code = response.code as (keyof typeof ERROR_LIST);
      const errorMsg = ERROR_LIST[code] || 'unknown code';
      this.deleteMap(tag);
      if (code === 0) {
        const data = response.data
        return data;
      }
      return `code[${code}]:${errorMsg}`;
    } catch (error) {
      return 'error'
    }
  }

  public async getAction(): Promise<any> {
    try {
      const tag = 'ACTION?';
      const command = this.client.getAction();
      const response = await this.sendCommand(command, tag);
      const code = response.code;
      this.deleteMap(tag);
      if (code === 0) {
        const cond = response.data?.cond
        return cond;
      }
      return null;
    } catch (error) {
      return null
    }
  }

  public async setModel(modelId: string): Promise<any> {
    try {
      const tag = 'MODEL';
      const command = this.client.setModel(modelId);
      const response = await this.sendCommand(command, tag);
      const code = response.code as (keyof typeof ERROR_LIST);
      const errorMsg = ERROR_LIST[code] || 'unknown code';
      this.resolveMap.delete(tag);
      this.rejectMap.delete(tag);
      if (code === 0) {
        const data = response.data
        return data;
      }
      return `code[${code}]:${errorMsg}`;
    } catch (error) {
      return 'error'
    }
  }

  public async setSensor(sensorId: string, state: number): Promise<any> {
    try {
      const tag = 'SENSOR';
      const command = this.client.setSensor(sensorId, state);
      const response = await this.sendCommand(command, tag);
      const code = response.code as (keyof typeof ERROR_LIST);
      const errorMsg = ERROR_LIST[code] || 'unknown code';
      this.resolveMap.delete(tag);
      this.rejectMap.delete(tag);
      if (code === 0) {
        const data = response.data
        return data;
      }
      return `code[${code}]:${errorMsg}`;
    } catch (error) {
      return 'error'
    }
  }

  public async sample(times: number): Promise<any> {
    try {
      const tag = 'SAMPLE';
      const command = this.client.sample(times);
      const response = await this.sendCommand(command, tag);
      const code = response.code;
      this.resolveMap.delete(tag);
      this.rejectMap.delete(tag);
      if (code === 0) {
        const data = response.data
        return data;
      }
      return null;
    } catch (error) {
      return null
    }
  }

  public async invoke(times: number): Promise<any> {
    try {
      const tag = 'INVOKE';
      const command = this.client.invoke(times);
      const response = await this.sendCommand(command, tag);
      const code = response.code;
      this.resolveMap.delete(tag);
      this.rejectMap.delete(tag);
      if (code === 0) {
        const data = response.data;
        if (data) {
          const config = data.algorithm?.config;
          if (config) {
            const tiou = config.tiou || 0;
            const tscore = config.tscore || 0;
            this.deviceStore.setIOU(tiou);
            this.deviceStore.setScore(tscore);
          }
          this.deviceStore.setIsInvoke(true);
        }
        return data;
      }
      return null;
    } catch (error) {
      return null
    }
  }

  public async setInfo(info: string): Promise<any> {
    try {
      const tag = 'INFO';
      const command = this.client.setInfo(info);
      const response = await this.sendCommand(command, tag);
      const code = response.code as (keyof typeof ERROR_LIST);
      const errorMsg = ERROR_LIST[code] || 'unknown code';
      this.resolveMap.delete(tag);
      this.rejectMap.delete(tag);
      if (code === 0) {
        const data = response.data
        return data;
      }
      return `code[${code}]:${errorMsg}`;
    } catch (error) {
      return error
    }
  }

  public async deleteInfo(): Promise<any> {
    try {
      const tag = 'INFO!';
      const command = this.client.deleteInfo();
      const response = await this.sendCommand(command, tag);
      const code = response.code as (keyof typeof ERROR_LIST);
      const errorMsg = ERROR_LIST[code] || 'unknown code';
      this.resolveMap.delete(tag);
      this.rejectMap.delete(tag);
      if (code === 0) {
        const data = response.data
        return data;
      }
      return `code[${code}]:${errorMsg}`;
    } catch (error) {
      return error
    }
  }

  public async setScore(score: number): Promise<string> {
    try {
      const timestamp = new Date().getTime();
      const tag = `${timestamp}@TSCORE`;
      const command = this.client.setScore(score, tag);
      const response = await this.sendCommand(command, tag);
      const code = response.code as (keyof typeof ERROR_LIST);
      const errorMsg = ERROR_LIST[code] || 'unknown code';
      this.deleteMap(tag);
      if (code === 0) {
        const data = response.data
        return data;
      }
      return `code[${code}]:${errorMsg}`;
    } catch (error) {
      return 'error'
    }
  }

  public async setAction(target: number, condition: string, score: number): Promise<boolean> {
    try {
      const tag = 'ACTION';
      const command = this.client.setAction(target, condition, score);
      const response = await this.sendCommand(command, tag);
      const code = response.code;
      this.deleteMap(tag);
      return code === 0;
    } catch (error) {
      return false
    }
  }

  public async deleteAction(): Promise<boolean> {
    try {
      const tag = 'ACTION';
      const command = this.client.deleteAction();
      const response = await this.sendCommand(command, tag);
      const code = response.code;
      this.deleteMap(tag);
      return code === 0;
    } catch (error) {
      return false
    }
  }

  public async setIOU(iou: number): Promise<string> {
    try {
      const timestamp = new Date().getTime();
      const tag = `${timestamp}@TIOU`;
      const command = this.client.setIOU(iou, tag);
      const response = await this.sendCommand(command, tag);
      const code = response.code as (keyof typeof ERROR_LIST);
      const errorMsg = ERROR_LIST[code] || 'unknown code';
      this.deleteMap(tag);
      if (code === 0) {
        const data = response.data
        return data;
      }
      return `code[${code}]:${errorMsg}`;
    } catch (error) {
      return 'error'
    }
  }

  public async setLed(state: number): Promise<any> {
    try {
      const tag = 'LED';
      const command = this.client.setLed(state);
      const response = await this.sendCommand(command, tag);
      const code = response.code as (keyof typeof ERROR_LIST);
      const errorMsg = ERROR_LIST[code] || 'unknown code';
      this.resolveMap.delete(tag);
      this.rejectMap.delete(tag);
      if (code === 0) {
        const data = response.data
        return data;
      }
      return `code[${code}]:${errorMsg}`;
    } catch (error) {
      return error
    }
  }

  public async reset(): Promise<any> {
    try {
      const tag = 'RST';
      const command = this.client.reset();
      const response = await this.sendCommand(command, tag);
      const code = response.code as (keyof typeof ERROR_LIST);
      const errorMsg = ERROR_LIST[code] || 'unknown code';
      this.resolveMap.delete(tag);
      this.rejectMap.delete(tag);
      if (code === 0) {
        const data = response.data
        return data;
      }
      return `code[${code}]:${errorMsg}`;
    } catch (error) {
      return error
    }
  }

  public async break(): Promise<any> {
    try {
      const tag = 'BREAK';
      const command = this.client.break();
      const response = await this.sendCommand(command, tag);
      const code = response.code as (keyof typeof ERROR_LIST);
      const errorMsg = ERROR_LIST[code] || 'unknown code';
      this.resolveMap.delete(tag);
      this.rejectMap.delete(tag);
      if (code === 0) {
        const data = response.data
        return data;
      }
      return `code[${code}]:${errorMsg}`;
    } catch (error) {
      return error
    }
  }
}
