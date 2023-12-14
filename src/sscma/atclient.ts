export const ERROR_LIST = {
  0: 'Success',
  1: 'Please retry',
  2: 'Logical error',
  3: 'Timeout',
  4: 'IO error',
  5: 'Invalid parameter',
  6: 'Out of memory',
  7: 'Busy',
  8: 'Not supported',
  9: 'Operation not permitted',
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

  public getAction(): string {
    return 'AT+ACTION?\r';
  }

  public getMqttPubsub(): string {
    return 'AT+MQTTPUBSUB?\r';
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
    return 'AT+INFO=""\r';
  }

  public setAction(target: number, condition: string, score: number): string {
    return `AT+ACTION="max_score(target,${target})${condition}${score}","LED=1","LED=0"\r`;
  }

  public deleteAction(): string {
    return 'AT+ACTION="","",""\r';
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

  public getWifi(): string {
    return 'AT+WIFI?\r';
  }

  public getMqttServer(): string {
    return 'AT+MQTTSERVER?\r';
  }

  public setWifi(ssid: string, password: string, encryption: number): string {
    return `AT+WIFI="${ssid}", ${encryption}, "${password}"\r`;
  }

  public setMqttServer(
    host: string,
    port: number,
    username: string,
    password: string,
    ssl: number
  ): string {
    return `AT+MQTTSERVER="","${host}",${port},"${username}","${password}", ${ssl} \r`;
  }

  public reset(): string {
    return 'AT+RST\r';
  }

  public break(): string {
    return 'AT+BREAK\r';
  }
}
