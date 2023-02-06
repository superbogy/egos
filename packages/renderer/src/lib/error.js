export class ServiceError extends Error {
  constructor(err) {
    super(err.message);
    this.err = true;
    this.code = err.code;
    this.message = err.message;
    this.detail = err.detail || '';
  }
}
