export class Serial {
  private port: SerialPort | null;

  private reader: ReadableStreamDefaultReader | null;

  private writer: WritableStreamDefaultWriter | null;

  public onReceive: any;

  public onReceiveError: any;

  constructor(port: SerialPort) {
    this.port = port;
    this.reader = null;
    this.writer = null;
    this.onReceive = null;
    this.onReceiveError = null;
  }

  public async connect(): Promise<void> {
    if (this.port === null) {
      return;
    }

    const readLoop = () => {
      if (this.reader === null) {
        return;
      }
      this.reader
        .read()
        .then(({ value }) => {
          if (this.onReceive !== null) {
            this.onReceive(value);
          }
          readLoop();
        })
        .catch((error: any) => {
          if (this.onReceiveError !== null) {
            this.onReceiveError(error);
          }
        });
    };

    this.port.open({ baudRate: 115200 }).then(() => {
      if (this.port === null) {
        return;
      }
      if (this.port.readable === null || this.port.writable === null) {
        return;
      }
      this.reader = this.port.readable.getReader();
      this.writer = this.port.writable.getWriter();
      readLoop();
    });
  }

  public async disconnect(): Promise<void> {
    if (this.reader === null || this.writer === null || this.port === null) {
      return Promise.resolve();
    }
    this.reader.releaseLock();
    this.writer.releaseLock();
    return this.port.close();
  }

  public async write(data: BufferSource): Promise<void> {
    if (this.writer === null) {
      return;
    }
    this.writer.write(data);
  }

  public async getSerialPort() {
    return this.port;
  }
}

export async function getSerials(): Promise<Serial[]> {
  return navigator.serial.getPorts().then((ports: SerialPort[]) => {
    return ports.map((port: SerialPort) => {
      return new Serial(port);
    });
  });
}

export async function requestSerial(): Promise<Serial> {
  return navigator.serial.requestPort().then((port: SerialPort) => {
    return new Serial(port);
  });
}

export default {
  getSerials,
  requestSerial,
};
