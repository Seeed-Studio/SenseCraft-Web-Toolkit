// eslint-disable-next-line import/prefer-default-export
export function delay(time: number, isReject = false) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      if (isReject) {
        reject();
      } else {
        resolve();
      }
    }, time);
  });
}
