import { Database } from 'sqlite';
import { FieldTypes } from './schema';
import {
  addConnection,
  column,
  connect,
  connections,
  index,
  table,
} from './decorators';

describe('decorators', () => {
  describe('connect Function', () => {
    it('should able load sqlite db', async () => {
      const db = await addConnection('demo', {
        filename: '',
      });
      expect(db).toBeInstanceOf(Database);
      expect(connections.demo).toBe(db);
      delete connections.demo;
    });
    it('should attach lazy connect function to class _db property', async () => {
      @connect('foo')
      class Bar {
        _db: any;
      }
      const bar = new Bar();
      const db = await addConnection('foo', {
        filename: '',
      });
      expect(bar).toHaveProperty('_db', expect.any(Function));
      const foo = await Promise.resolve(bar._db());
      expect(foo).toBe(db);
      delete connections.foo;
    });
  });
  describe('table & column & index', () => {
    it('should attach table to class _table property', () => {
      @table('t1')
      class Table1 {
        _table: string;
      }
      const table1 = new Table1();
      expect(table1).toHaveProperty('_table', 't1');
    });
    it('should attach column meta info to class instance', () => {
      const colSchema = {
        type: FieldTypes.TEXT,
        name: 'id',
        nullable: false,
        encode: (value: any) => value + 1,
        decode: (value: any) => value - 1,
        pk: true,
        autoIncrement: true,
        default: 0,
        onChange: (value: any) => value,
      };
      class Table2 {
        schema: any;
        @column(colSchema)
        col1: string;
      }
      const t2 = new Table2();
      const meta = Reflect.getMetadata('model:schema', t2);
      expect(meta).toEqual({
        col1: {
          type: 'TEXT',
          name: 'id',
          nullable: false,
          encode: colSchema.encode,
          decode: colSchema.decode,
          pk: true,
          autoIncrement: true,
          default: 0,
          onChange: colSchema.onChange,
        },
      });
    });
    it('should attach index meta info to class instance', () => {
      const indexSchema = {
        name: 'name',
        unique: true,
        condition: { id: { $gt: 10 } },
        columns: ['id', 'name'],
      };
      class Table2 {
        schema: any;
        @index(indexSchema)
        col1: string;
      }
      const t2 = new Table2();
      const meta = Reflect.getMetadata('model:indices', t2);
      expect(meta).toEqual({
        name: {
          name: 'name_idx',
          unique: true,
          columns: ['id', 'name'],
          condition: indexSchema.condition,
        },
      });
    });
  });
});
