import { Transform, TransformCallback, TransformOptions } from 'stream';

export type CAlculateCallback = (len: number, cost: number) => any;

export class SpeedStream extends Transform {
  private cursor: number;
  private lastPoint: number;
  private interval: NodeJS.Timer | null;
  public span: any;

  constructor(opts?: TransformOptions & { span?: number }) {
    super(opts);
    this.cursor = 0;
    this.lastPoint = 0;
    this.span = opts?.span || 1000;
    this.on('finish', () => {
      setTimeout(() => {
        this.reset();
      }, this.span);
    });
  }
  _transform(
    chunk: any,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this.cursor += chunk.length;
    this.push(chunk, encoding);
    callback();
  }

  reset() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.cursor = 0;
    this.lastPoint = 0;
  }

  _flush(callback: TransformCallback): void {
    callback();
  }

  calculate(cb: any) {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.interval = setInterval(async () => {
      await cb(this.cursor, this.lastPoint, this.span);
      this.lastPoint = this.cursor;
    }, this.span);
  }
}
