import RingBuffer from './ringBuffer';

export default class Serial {
  private port: SerialPort | null;

  private encoder: TextEncoder;
  private decoder: TextDecoder;

  private reader: ReadableStreamDefaultReader | null | undefined;
  private writer: WritableStreamDefaultWriter | null | undefined;

  private ringBuffer: RingBuffer;

  constructor(port: SerialPort) {
    this.port = port;
    this.reader = null;
    this.writer = null;
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
    this.ringBuffer = new RingBuffer(1024 * 1024);
  }

  private readloop = async (): Promise<void> => {
    while (this.reader) {
      const { value, done } = await this.reader.read();
      if (done) {
        this.reader.releaseLock();
        this.reader = null;
      }
      if (value) {
        this.ringBuffer.write(value);
      }
    }
  };

  public async open(options: SerialOptions): Promise<void> {
    this.ringBuffer.clear();
    await this.port.open(options);
    this.reader = this.port.readable.getReader();
    this.writer = this.port.writable.getWriter();
    this.readloop();
  }

  public async close(): Promise<void> {
    await this.reader?.cancel();
    await this.writer?.close();
    await this.port.close();
    this.reader = null;
    this.writer = null;
  }

  public async setDTR(value: boolean): Promise<void> {
    await this.port?.setSignals({ dataTerminalReady: value });
  }

  public async setRTS(value: boolean): Promise<void> {
    await this.port?.setSignals({ requestToSend: value });
  }

  public async writeString(data: string): Promise<void> {
    const buffer = this.encoder.encode(data);
    await this.writer?.write(buffer);
  }

  public async write(data: Uint8Array): Promise<void> {
    // console.log('write', data);
    await this.writer?.write(data);
  }

  public async read(): Promise<Uint8Array> {
    return this.ringBuffer.read();
  }

  public async readString(): Promise<string> {
    const data = await this.ringBuffer.read();
    if (data) {
      return this.decoder.decode(data);
    }
    return '';
  }

  public async readBytes(length: number, timeout = 1000): Promise<Uint8Array> {
    return this.ringBuffer.readBytes(length, timeout);
  }

  public async readUntil(code: number, timeout = 1000): Promise<string> {
    const data = await this.ringBuffer.readUntil(code, timeout);
    if (data) {
      return this.decoder.decode(data);
    }
    return '';
  }

  public async readUntilString(
    placeHolder: string,
    timeout = 1000
  ): Promise<string> {
    const data = await this.ringBuffer.readUntilString(placeHolder, timeout);
    if (data) {
      return this.decoder.decode(data);
    }
    return '';
  }

  public available(): number {
    return this.ringBuffer.available();
  }

  public clear(): void {
    this.ringBuffer.clear();
  }
}
