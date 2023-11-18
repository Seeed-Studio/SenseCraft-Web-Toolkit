/**
 * A class representing a ring buffer that can be used to store and retrieve bytes.
 */
export default class RingBuffer {
  private buffer: Uint8Array;
  private readIndex: number;
  private writeIndex: number;

  /**
   * Creates a new instance of the RingBuffer class.
   * @param size - The size of the buffer, in bytes.
   */
  constructor(size: number) {
    this.buffer = new Uint8Array(size);
    this.readIndex = 0;
    this.writeIndex = 0;
  }

  /**
   * Writes the specified bytes to the buffer.
   * @param data - The bytes to write to the buffer.
   */
  write(data: Uint8Array) {
    for (let i = 0; i < data.length; i += 1) {
      this.buffer[this.writeIndex] = data[i];
      this.writeIndex = (this.writeIndex + 1) % this.buffer.length;
      if (this.writeIndex === this.readIndex) {
        this.readIndex = (this.readIndex + 1) % this.buffer.length;
      }
    }
  }

  /**
   * Reads all available bytes from the buffer.
   * @returns A Uint8Array containing the bytes read from the buffer.
   */
  async read(): Promise<Uint8Array> {
    const output = [];
    while (this.readIndex !== this.writeIndex) {
      const value = this.buffer[this.readIndex];
      this.readIndex = (this.readIndex + 1) % this.buffer.length;
      output.push(value);
    }
    return new Uint8Array(output);
  }

  async readBytes(length: number, timeout = 1000): Promise<Uint8Array> {
    const output = [];
    const start = Date.now();
    while (true) {
      if (Date.now() - start > timeout) {
        break;
      }
      if (this.readIndex === this.writeIndex) {
        // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
        await new Promise((resolve) => setTimeout(resolve, 1));
        // eslint-disable-next-line no-continue
        continue; // Buffer is empty
      }
      const value = this.buffer[this.readIndex];
      this.readIndex = (this.readIndex + 1) % this.buffer.length;
      output.push(value);
      if (output.length >= length) {
        break;
      }
    }
    return new Uint8Array(output);
  }

  /**
   * Returns the specified number of bytes from the buffer without removing them.
   * @param length - The number of bytes to peek from the buffer.
   * @returns A Uint8Array containing the bytes peeked from the buffer.
   */
  peek(length: number): Uint8Array {
    const output = new Uint8Array(length);
    for (let i = 0; i < length; i += 1) {
      if (this.readIndex === this.writeIndex) {
        break; // Buffer is empty
      }
      output[i] = this.buffer[this.readIndex];
    }
    return output;
  }

  /**
   * Reads from the buffer until the specified byte code is found or a timeout is reached.
   * @param code - The byte code to search for in the buffer.
   * @param timeout - The maximum amount of time to wait for the byte code, in milliseconds.
   * @returns A Uint8Array containing the bytes read from the buffer.
   */
  async readUntil(code: number, timeout = 1000): Promise<Uint8Array> {
    const output = [];
    const start = Date.now();
    while (true) {
      if (Date.now() - start > timeout) {
        break;
      }
      if (this.readIndex === this.writeIndex) {
        // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
        await new Promise((resolve) => setTimeout(resolve, 1));
        // eslint-disable-next-line no-continue
        continue; // Buffer is empty
      }
      const value = this.buffer[this.readIndex];
      this.readIndex = (this.readIndex + 1) % this.buffer.length;
      output.push(value);
      if (value === code) {
        break;
      }
    }
    return new Uint8Array(output);
  }

  /**
   * Reads from the buffer until the specified placeholder string is found or a timeout is reached.
   * @param placeHolder - The string to search for in the buffer.
   * @param timeout - The maximum amount of time to wait for the placeholder string, in milliseconds.
   * @returns A Uint8Array containing the bytes read from the buffer.
   * @throws An error if the timeout is reached before the placeholder string is found.
   */
  async readUntilString(
    placeHolder: string,
    timeout = 1000
  ): Promise<Uint8Array> {
    const output = [];
    const start = Date.now();
    while (true) {
      if (Date.now() - start > timeout) {
        break;
      }
      if (this.readIndex === this.writeIndex) {
        // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
        await new Promise((resolve) => setTimeout(resolve, 1));
        // eslint-disable-next-line no-continue
        continue; // Buffer is empty
      }
      const value = this.buffer[this.readIndex];
      this.readIndex = (this.readIndex + 1) % this.buffer.length;
      output.push(value);
      if (output.length >= placeHolder.length) {
        const str = String.fromCharCode(...output.slice(-placeHolder.length));
        if (str === placeHolder) {
          break;
        }
      }
    }
    return new Uint8Array(output);
  }

  /**
   * Returns the number of bytes available to read from the buffer.
   * @returns The number of bytes available to read from the buffer.
   */
  available(): number {
    if (this.writeIndex >= this.readIndex) {
      return this.writeIndex - this.readIndex;
    }
    return this.buffer.length - this.readIndex + this.writeIndex;
  }

  /**
   * Clears the buffer.
   */
  clear() {
    this.readIndex = 0;
    this.writeIndex = 0;
  }

  /**
   * Returns the size of the buffer, in bytes.
   * @returns The size of the buffer, in bytes.
   */
  size(): number {
    return this.buffer.length;
  }
}
