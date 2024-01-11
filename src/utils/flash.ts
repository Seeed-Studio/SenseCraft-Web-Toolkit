import { Message } from '@arco-design/web-vue';
import i18n from '@/locale';

export function flashErrorHandle(error?: Error, defaultMsg?: string) {
  if (
    [
      `Failed to execute 'open' on 'SerialPort': Failed to open serial port.`,
      `Failed to execute 'close' on 'SerialPort': The port is already closed.`,
    ].includes(error?.message ?? '')
  ) {
    Message.error(i18n.global.t('workplace.serial.device.port.occupied'));
  } else if (error?.message?.includes('No port selected by the user')) {
    Message.error(i18n.global.t('workplace.serial.no.port'));
  } else {
    Message.error(defaultMsg ?? error?.message ?? '');
  }
}

export default null;
