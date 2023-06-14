import { Transform, TransformCallback, TransformOptions } from 'stream';

export type CalculateCallback = (
  cursor: number,
  lastPoint: number,
  span: number,
) => void;

export class SpeedStream extends Transform {
  private cursor: number;
  private lastPoint: number;
  public span: any;
  private speedCB: CalculateCallback;

  constructor(opts?: TransformOptions & { span?: number }) {
    super(opts);
    this.cursor = 0;
    this.lastPoint = 0;
    this.span = opts?.span || 1000;
    this.on('finish', () => {
      console.log('stream finish');
      this.reset();
    });
    this.on('data', async () => {
      // console.log(this.cursor, this.lastPoint);
      await Promise.resolve(
        this.speedCB.apply(this, [this.cursor, this.lastPoint, this.span]),
      );
      this.lastPoint = this.cursor;
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
    this.cursor = 0;
    this.lastPoint = 0;
  }

  _flush(callback: TransformCallback): void {
    callback();
  }

  calculate(cb: CalculateCallback) {
    this.speedCB = cb;
  }
}
