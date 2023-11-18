import events from 'events';
import crc from 'crc';

export interface XmodemOptions {
  mode?: string;
  blocksize?: number;
  maxTimeouts?: number;
  maxErrors?: number;
  crcAttempts?: number;
  startBlock?: number;
  timeoutSeconds?: number;
}

export default class Xmodem {
  private readonly NC = 0x00;
  private readonly SOH = 0x01;
  private readonly STX = 0x02;
  private readonly ETX = 0x03;
  private readonly EOT = 0x04;
  private readonly ENQ = 0x05;
  private readonly ACK = 0x06;
  private readonly NAK = 0x15;
  private readonly ETB = 0x17;
  private readonly CAN = 0x18;
  private readonly CRC_MODE = 0x43; // 'C'
  private readonly EOF = 0x1a;
  private readonly FILLER = 0x1a;

  private mode: string;
  private blocksize: number;
  private maxTimeouts: number;
  private maxErrors: number;
  private crcAttempts: number;
  private startBlock: number;
  private timeoutSeconds: number;

  private read:
    | ((length: number, timeout: number) => Promise<Uint8Array>)
    | null;

  private write: ((data: Uint8Array) => Promise<void>) | null;

  private progress:
    | ((block: number, total: number, percent: number) => void)
    | null = null;

  constructor(options: XmodemOptions) {
    this.mode = options.mode || 'xmodem';
    this.blocksize = options.blocksize || 128;
    this.maxTimeouts = options.maxTimeouts || 10;
    this.maxErrors = options.maxErrors || 30;
    this.crcAttempts = options.crcAttempts || 5;
    this.startBlock = options.startBlock || 1;
    this.timeoutSeconds = options.timeoutSeconds || 60;
    this.read = null;
    this.write = null;
  }

  public setRead(
    read: (length: number, timeout: number) => Promise<Uint8Array>
  ): void {
    this.read = read;
  }

  public setWrite(write: (data: Uint8Array) => Promise<void>): void {
    this.write = write;
  }

  public setProgress(
    progress: (block: number, total: number, percent: number) => void
  ): void {
    this.progress = progress;
  }

  private createPacket = (block: number, data: Uint8Array): Uint8Array => {
    const packet = new Uint8Array(this.blocksize + 5);
    packet[0] = this.SOH;
    packet[1] = block;
    packet[2] = 0xff - block;
    packet.set(data, 3);
    if (this.mode === 'crc') {
      const crc16 = crc.crc16xmodem(data);
      packet[this.blocksize + 3] = crc16 >> 8;
      packet[this.blocksize + 4] = crc16 & 0xff;
    } else {
      let checksum = 0;
      for (let i = 0; i < this.blocksize; i += 1) {
        checksum += data[i];
      }
      packet[this.blocksize + 3] = checksum & 0xff;
    }
    return packet;
  };

  public async send(data: Uint8Array): Promise<void> {
    const emitter = new events.EventEmitter();
    const buffer = new Uint8Array(this.blocksize);
    const timeout = this.timeoutSeconds * 1000;
    let block = this.startBlock;
    let errors = 0;
    let timeouts = 0;
    let crcAttempts = 0;
    let offset = 0;
    let code = 0;
    const total = Math.ceil(data.length / this.blocksize);

    const sendBlock = async () => {
      if (this.read === null || this.write === null) {
        return;
      }
      // console.log('sendBlock block:', block);
      buffer.fill(this.FILLER);
      buffer.set(data.slice(offset, offset + this.blocksize));
      const packet = this.createPacket(block, buffer.slice(0, this.blocksize));
      await this.write(packet);
      const value = await this.read(1, timeout);
      code = value[0];
      switch (code) {
        case this.ACK:
          emitter.emit(
            'status',
            block,
            total,
            Math.floor((block / total) * 100)
          );
          block += 1;
          offset += this.blocksize;
          if (offset < data.length) {
            sendBlock();
          } else {
            errors = 0;
            timeouts = 0;
            crcAttempts = 0;
            emitter.emit('waitEnd');
          }
          break;
        case this.NAK:
          errors += 1;
          if (errors > this.maxErrors) {
            emitter.emit('error', new Error('Too many errors'));
          } else {
            sendBlock();
          }
          break;
        case this.CAN:
          emitter.emit('error', new Error('Transfer canceled'));
          break;
        default:
          timeouts += 1;
          if (timeouts > this.maxTimeouts) {
            throw new Error('Too many timeouts');
          } else if (this.mode === 'crc' && crcAttempts < this.crcAttempts) {
            crcAttempts += 1;
            sendBlock();
          } else {
            throw new Error('Too many timeouts');
          }
          break;
      }
    };

    const waitEnd = async () => {
      if (this.read === null || this.write === null) {
        return;
      }
      console.log('waitEnd');
      const packet = new Uint8Array(1);
      packet[0] = this.EOT;
      await this.write(packet);
      const value = await this.read(1, timeout);
      code = value[0];
      switch (code) {
        case this.ACK:
          emitter.emit('end');
          break;
        case this.NAK:
          errors += 1;
          if (errors > this.maxErrors) {
            emitter.emit('error', new Error('Too many errors'));
          } else {
            waitEnd();
          }
          break;
        default:
          timeouts += 1;
          if (timeouts > this.maxTimeouts) {
            emitter.emit('error', new Error('Too many timeouts'));
          } else {
            waitEnd();
          }
          break;
      }
    };
    const waitStart = async () => {
      if (this.read === null || this.write === null) {
        return;
      }
      console.log('waitStart');
      const value = await this.read(1, timeout);
      console.log(value);
      code = value[0];

      switch (code) {
        case this.CRC_MODE:
          this.mode = 'crc';
          timeouts = 0;
          emitter.emit('start');
          break;
        default:
          timeouts += 1;
          if (timeouts > this.maxTimeouts) {
            emitter.emit('error', new Error('Too many timeouts'));
          } else {
            waitStart();
          }
          break;
      }
    };
    emitter.on('waitStart', waitStart);
    emitter.on('waitEnd', waitEnd);
    emitter.on('start', sendBlock);
    emitter.on('status', (block, total, percent) => {
      this.progress?.(block, total, percent);
    });

    emitter.emit('waitStart');

    return new Promise((resolve, reject) => {
      emitter.on('end', resolve);
      emitter.on('error', reject);
    });
  }
}
