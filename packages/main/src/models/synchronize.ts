import { jsonParser, jsonStringify } from '../lib/helper';
import Model from './base';
import { column, table } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';

@table('synchronization')
export class SyncModel extends Model {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: string;
  @column({ type: FieldTypes.TEXT })
  type: string;
  @column({ type: FieldTypes.TEXT })
  sourceId: string;
  @column({ type: FieldTypes.TEXT })
  fromBucket: string;
  @column({ type: FieldTypes.TEXT })
  toBucket: string;
  @column({ type: FieldTypes.INT })
  objectId: number;
  @column({ type: FieldTypes.INT })
  status: number;
  @column({ type: FieldTypes.TEXT })
  local: string;
  @column({ type: FieldTypes.BLOB, encode: jsonStringify, decode: jsonParser })
  failed: number;
}

export const Synchronize = new SyncModel();
