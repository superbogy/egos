export class ServiceError extends Error {
  code: number;
  detail: string | Record<string, any>;
  constructor(err: any) {
    super(err.message);
    this.code = err.code;
    this.message = err.message;
    this.detail = err.detail || '';
  }
}
