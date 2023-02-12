import { column, table } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';

@table('tasks')
class TaskModel extends Base {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: string;
  @column({ type: FieldTypes.TEXT })
  action: string;
  @column({ type: FieldTypes.TEXT })
  type: string;
  @column({ type: FieldTypes.TEXT })
  status: string;
  @column({ type: FieldTypes.TEXT })
  payload: string;
  @column({ type: FieldTypes.INT })
  retry: number;
  @column({ type: FieldTypes.INT })
  maxRetry: number;
  @column({ type: FieldTypes.INT })
  targetId: number;
  @column({ type: FieldTypes.TEXT })
  err: string;
}

export const Task = new TaskModel();
