export default interface FlasherInterface {
  isNeedConnectDevice: boolean;
  isNeedResetDevice: boolean;
  writeFlashBefore(): void | Promise<void>;
  onWriteFlash<T>(data: T): Promise<boolean>;
  onResetDevice(): Promise<void>;
  onConnectDevice(): void | Promise<void>;

  onEraseFlashBefore(): void | Promise<void>;
  onEraseFlash(): Promise<boolean>;
}
