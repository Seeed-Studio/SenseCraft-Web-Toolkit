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

export async function retry(
  fn: () => Promise<any>,
  retryCount: number,
  interval: number,
  errSymbol?: any
): Promise<any> {
  try {
    const result = await fn();
    if (errSymbol !== undefined && result === errSymbol && retryCount > 0) {
      await delay(interval);
      return retry(fn, retryCount - 1, errSymbol);
    }
    return result;
  } catch (err) {
    if (errSymbol === undefined && retryCount > 0) {
      await delay(interval);
      return retry(fn, retryCount - 1, errSymbol);
    }
    throw err;
  }
}
