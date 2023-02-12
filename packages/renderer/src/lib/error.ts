export class ServiceError extends Error {
  code: number;
  detail: any;
  constructor(msg: any, options: any) {
    super(msg, options);
    this.code = options.code;
    this.detail = options;
  }
}
