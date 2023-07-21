export class Serial {
  private port: SerialPort | null;

  private reader: ReadableStreamDefaultReader;

  private writer: WritableStreamDefaultWriter;

  private textEncoder: TextEncoder;

  private onReceive: any;

  private onReceiveError: any;

  constructor(port: SerialPort) {
    this.port = port;
    this.reader = null;
    this.writer = null;
    this.textEncoder = new TextEncoderStream();
  }

  public async connect(baudRate : number): Promise<void> {
    const readLoop = () => {
      this.reader
        .read()
        .then((result: { value: any }) => {
          this.onReceive(result.value);
          readLoop();
        })
        .catch((error: any) => {
          this.onReceiveError(error);
        });
    };

    return this.port.open({ baudRate }).then(() => {
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

  public async send(data: string): Promise<void> {
    const dataArrayBuffer = this.textEncoder.encode(data);
    return this.writer.write(dataArrayBuffer);
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
