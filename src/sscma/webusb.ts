import Device from './device';

export default class WebUSB extends Device {
  public port: USBDevice | null;

  private interfaceNumber: number;

  private endpointIn: number;

  private endpointOut: number;

  constructor() {
    super();
    this.port = null;
    this.interfaceNumber = 0;
    this.endpointIn = 0;
    this.endpointOut = 0;
  }

  public async connect(): Promise<void> {
    const readLoop = () => {
      this.port
        ?.transferIn(this.endpointIn, 2048)
        .then((result: any) => {
          readLoop();
        })
        .catch((error: any) => {
          console.log(error);
        });
    };

    return this.port
      ?.open()
      .then(() => {
        if (this.port?.configuration === null) {
          return this.port.selectConfiguration(1);
        }
        return Promise.resolve();
      })
      .then(() => {
        if (
          this.port?.configuration !== undefined &&
          this.port.configuration!
        ) {
          const cinterfaces = this.port.configuration.interfaces;
          cinterfaces.forEach(
            (element: { alternates: any[]; interfaceNumber: number }) => {
              element.alternates.forEach(
                (elementalt: { interfaceClass: number; endpoints: any[] }) => {
                  if (elementalt.interfaceClass === 0xff) {
                    this.interfaceNumber = element.interfaceNumber;
                    elementalt.endpoints.forEach(
                      (elementendpoint: {
                        direction: string;
                        endpointNumber: number;
                      }) => {
                        if (elementendpoint.direction === 'out') {
                          this.endpointOut = elementendpoint.endpointNumber;
                        }
                        if (elementendpoint.direction === 'in') {
                          this.endpointIn = elementendpoint.endpointNumber;
                        }
                      }
                    );
                  }
                }
              );
            }
          );
        }
      })
      .then(() => this.port?.claimInterface(this.interfaceNumber))
      .then(() => this.port?.selectAlternateInterface(this.interfaceNumber, 0))
      .then(() =>
        this.port?.controlTransferOut({
          requestType: 'class',
          recipient: 'interface',
          request: 0x22,
          value: 0x01,
          index: this.interfaceNumber,
        })
      )
      .then(() => {
        readLoop();
      });
  }

  public async disconnect() {
    try {
      await this.port?.controlTransferOut({
        requestType: 'class',
        recipient: 'interface',
        request: 0x22,
        value: 0x00,
        index: this.interfaceNumber,
      });
      this.port?.close();
    } catch (error) {
      console.log(error);
    }
  }

  public async write(data: BufferSource): Promise<any> {
    const res = await this.port?.transferOut(this.endpointOut, data);
    return res?.bytesWritten;
  }
}
