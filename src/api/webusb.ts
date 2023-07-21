export class Port {
  private device: USBDevice;

  public interfaceNumber: number;

  public endpointIn: number;

  public endpointOut: number;

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
        .then((result: { data: any }) => {
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
    console.log('I am disconnecting');
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

  public send(data: ArrayBuffer): Promise<void> {
    return this.device.transferOut(this.endpointOut, data);
  }
}

export async function getPorts(): Promise<Port[]> {
  return navigator.usb.getDevices().then((devices: USBDevice[]) => {
    return devices.map((device: USBDevice) => new Port(device));
  });
}

export async function requestPort(): Promise<Port> {
  const filters = [{ vendorId: 0x2886 }]; // Seeed studio Grove AI
  return navigator.usb
    .requestDevice({ filters })
    .then((device: USBDevice) => new Port(device));
}

export default {
  getPorts,
  requestPort,
};
