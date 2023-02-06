import Driver from './abstract';
import { FileDriver } from './file';
import { BucketItem } from './interface';
import { OssDriver } from './oss';

export const drivers = [FileDriver, OssDriver];

// @todo
export const driverInstance: Record<string, Driver> = {};

export const getDriver = (bucket: BucketItem) => {
  const driver = drivers.find((d) => {
    return d.serviceName === bucket.driver;
  });
  if (!driver) {
    throw new Error('Invalid driver');
  }
  if (!driverInstance[driver.serviceName]) {
    driverInstance[driver.serviceName] = new driver(bucket);
  }
  return driverInstance[driver.serviceName];
};

export const getDriverSchema = (driverName: string) => {
  const driver = drivers.find((d) => {
    return d.serviceName === driverName;
  });
  if (!driver) {
    throw new Error('Driver not found');
  }
  return driver._schema;
};

export const getDriverSchemas = () => {
  const res: Record<string, any> = {};
  drivers.forEach((item) => (res[item.serviceName] = item._schema));
  return res;
};

export * from './utils';
