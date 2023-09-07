export const ERROR_LIST = {
  0: '成功',
  1: '请重试',
  2: '逻辑错误',
  3: '超时',
  4: 'IO错误',
  5: '无效参数',
  6: '内存不足',
  7: '忙碌',
  8: '不支持',
  9: '操作不允许',
};

export class ATClient {

  public getID(): string {
    return 'AT+ID?\r';
  }

  public getName(): string {
    return 'AT+NAME?\r';
  }

  public getStat(): string {
    return 'AT+STAT?\r';
  }

  public getVersion(): string {
    return 'AT+VER?\r';
  }

  public getAlgorithms(): string {
    return 'AT+ALGOS?\r';
  }

  public getModels(): string {
    return 'AT+MODELS?\r';
  }

  public getModel(): string {
    return 'AT+MODEL?\r';
  }

  public getSensors(): string {
    return 'AT+SENSORS?\r';
  }

  public getSensor(): string {
    return 'AT+SENSOR?\r';
  }

  public getSampleState(): string {
    return 'AT+SAMPLE?\r';
  }

  public getInvokeState(): string {
    return 'AT+INVOKE?\r';
  }

  public getInfo(): string {
    return 'AT+INFO?\r';
  }

  public getScore(): string {
    return 'AT+TSCORE?\r';
  }

  public getIOU(): string {
    return 'AT+TIOU?\r';
  }

  public setModel(modelId: string): string {
    return `AT+MODEL=${modelId}\r`;
  }

  public setSensor(sensorId: string, state: number): string {
    return `AT+SENSOR=${sensorId},${state}\r`;
  }

  // times=-1` for infinity loop
  public sample(times: number): string {
    return `AT+SAMPLE=${times}\r`;
  }

  // times=-1` for infinity loop
  public invoke(times: number): string {
    return `AT+INVOKE=${times},0\r`;
  }

  public setInfo(info: string): string {
    return `AT+INFO="${info}"\r`;
  }

  public deleteInfo(): string {
    return 'AT+INFO!\r';
  }

  public setScore(score: number, tag: string): string {
    return `AT+${tag}=${score}\r`;
  }

  public setIOU(iou: number, tag: string): string {
    return `AT+${tag}=${iou}\r`;
  }

  public setLed(state: number): string {
    return `AT+LED=${state}\r`;
  }

  public reset(): string {
    return 'AT+RST\r';
  }

  public break(): string {
    return 'AT+BREAK\r';
  }
}

