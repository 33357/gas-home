export function sleep(s: number) {
  log(`wait ${s} s`);
  return new Promise((resolve) => setTimeout(resolve, s * 1000));
}

export function log(...args: any) {
  console.log(new Date().toLocaleString(), ...args);
}

export async function retry(func: Function, time: number, args?: Array<any>, callback?: Function): Promise<any> {
  try {
    let res;
    if (args) {
      res = await func(...args);
    } else {
      res = await func();
    }
    if (callback) {
      await callback(res);
    }
    return res;
  } catch (error) {
    time--;
    if (time > 0) {
      log(`retry ${time}, ${error}`);
      return await retry(func, time, args, callback);
    } else {
      throw error;
    }
  }
}
