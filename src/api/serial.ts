export class Serial {
  private port: SerialPort | null;

  private reader: ReadableStreamDefaultReader | null;

  private writer: WritableStreamDefaultWriter | null;

  private onReceive: any;

  private onReceiveError: any;

  constructor(port: SerialPort) {
    this.port = port;
    this.reader = null;
    this.writer = null;
  }

  public async connect(): Promise<void> {
    const readLoop = () => {
      if (this.reader === null) {
        return;
      }
      this.reader
        .read()
        .then(({ value, done }) => {
          this.onReceive(value);
          readLoop();
        })
        .catch((error: any) => {
          this.onReceiveError(error);
        });
    };

    return this.port.open({ baudRate: 115200 }).then(() => {
      this.reader = this.port.readable.getReader();
      this.writer = this.port.writable.getWriter();
      readLoop();
    });
  }

  public async disconnect(): Promise<void> {
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
}

export async function getSerials(): Promise<Serial[]> {
  return navigator.serial.getPorts().then((ports: SerialPort[]) => {
    return ports.map((port: SerialPort) => {
      return new Serial(port);
    });
  });
}

export async function requestSerial(): Promise<Serial> {
  return navigator.serial.requestPort([]).then((port: SerialPort) => {
    return new Serial(port);
  });
}

export default {
  getSerials,
  requestSerial,
};
