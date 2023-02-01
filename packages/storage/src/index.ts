import Driver from './abstract';
import { FileDriver } from './file';
import { BucketItem } from './interface';
import { OssDriver } from './oss';

export const drivers = [FileDriver, OssDriver];

// @todo
export const driverInstance: Record<string, Driver> = {};

export const getDriver = (bucket: BucketItem) => {
  const driver = drivers.find((d) => {
    return d.name === bucket.driver;
  });
  if (!driver) {
    throw new Error('Invalid driver');
  }
  if (!driverInstance[driver.name]) {
    driverInstance[driver.name] = new driver(bucket);
  }
  return driverInstance[driver.name];
};

export const getDriverSchema = (driverName: string) => {
  const driver = drivers.find((d) => {
    return d.name === driverName;
  });
  if (!driver) {
    throw new Error('Driver not found');
  }
  return driver.schema;
};

export const getDriverSchemas = () => {
  const res: Record<string, any> = {};
  drivers.forEach((item) => (res[item.name] = item.schema));
  return res;
};

export * from './utils';

export * from './interface';
