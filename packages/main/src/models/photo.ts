import { column, schema, table } from '@egos/lite';
import { FieldTypes } from '@egos/lite/dist/schema';
import Base from './base';

export class PhotoSchema {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.TEXT })
  name: string;
  @column({ type: FieldTypes.INT })
  albumId: number;
  @column({ type: FieldTypes.INT })
  objectId: number;
  @column({ type: FieldTypes.INT })
  rank: number;
  @column({ type: FieldTypes.TEXT })
  location: string;
  @column({ type: FieldTypes.TEXT })
  description: number;
  @column({ type: FieldTypes.TEXT })
  status: string;
  @column({ type: FieldTypes.INT })
  isEncrypt: number;
  @column({ type: FieldTypes.TEXT })
  password: string;
  @column({ type: FieldTypes.TEXT })
  url: string;
}

@table('photos')
@schema(PhotoSchema)
class PhotoModel extends Base {}

export const Photo = new PhotoModel();
