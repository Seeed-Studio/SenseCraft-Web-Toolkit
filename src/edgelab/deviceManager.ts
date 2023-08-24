import Serial from './serial';
import Device from "./device";


class DeviceManager {
    public protocol: string;
    public device: Device;

    constructor() {
        this.protocol = localStorage.getItem('protocol') || 'serial';
        this.device = new Serial();
    }
}

export default new DeviceManager()
