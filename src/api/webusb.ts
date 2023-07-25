export class WebUSB {
  private device: USBDevice;

  private interfaceNumber: number;

  private endpointIn: number;

  private endpointOut: number;

  public onReceive: any;

  public onReceiveError: any;

  constructor(device: USBDevice) {
    this.device = device;
    this.interfaceNumber = 0;
    this.endpointIn = 0;
    this.endpointOut = 0;
  }

  public async connect(): Promise<void> {
    const readLoop = () => {
      this.device
        .transferIn(this.endpointIn, 2048)
        .then((result: any) => {
          this.onReceive(result.data);
          readLoop();
        })
        .catch((error: any) => {
          this.onReceiveError(error);
        });
    };

    return this.device
      .open()
      .then(() => {
        if (this.device.configuration === null) {
          return this.device.selectConfiguration(1);
        }
        return Promise.resolve();
      })
      .then(() => {
        const cinterfaces = this.device.configuration.interfaces;
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
      })
      .then(() => this.device.claimInterface(this.interfaceNumber))
      .then(() => this.device.selectAlternateInterface(this.interfaceNumber, 0))
      .then(() =>
        this.device.controlTransferOut({
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

  public disconnect(): Promise<void> {
    return this.device
      .controlTransferOut({
        requestType: 'class',
        recipient: 'interface',
        request: 0x22,
        value: 0x00,
        index: this.interfaceNumber,
      })
      .then(() => this.device.close());
  }

  public write(data: BufferSource): Promise<void> {
    return this.device.transferOut(this.endpointOut, data);
  }
}

export async function getWebUSBs(): Promise<WebUSB[]> {
  return navigator.usb.getDevices().then((devices: USBDevice[]) => {
    return devices.map((device: USBDevice) => new WebUSB(device));
  });
}

export async function requestWebUSB(): Promise<WebUSB> {
  const filters = [{ vendorId: 0x2886 }]; // Seeed studio Grove AI
  return navigator.usb
    .requestDevice({ filters })
    .then((device: USBDevice) => new WebUSB(device));
}

export default {
  getWebUSBs,
  requestWebUSB,
};
