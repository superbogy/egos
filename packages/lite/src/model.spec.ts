import { Model, connect, table, column, ORDER_TYPE } from '../src';
import { FieldTypes } from './schema';
import 'reflect-metadata';
import { genSql } from './utils';
import { addConnection } from './decorators';
import { randomUUID } from 'crypto';

@connect('test')
@table('customer')
class CustomerModel extends Model {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.TEXT, default: '', name: 'user_name' })
  username: string;
  @column({ type: FieldTypes.INT, default: 0 })
  age: number;
  @column({ type: FieldTypes.TEXT, default: () => 1 })
  gender: string;
  @column({ type: FieldTypes.TEXT, decode: JSON.parse, encode: JSON.stringify })
  profile: string;
}
describe('Model', () => {
  const Customer = new CustomerModel();
  beforeAll(async () => {
    await addConnection('test', { filename: '' });
    const sql = genSql(Customer.table, Customer.schema);
    await Customer.exec(sql);
  });
  it('should able to get schema', () => {
    const schema = Customer.schema;
    expect(schema).toEqual({
      id: { type: 'INTEGER', pk: true, autoIncrement: true, name: 'id' },
      username: { type: 'TEXT', default: '', name: 'user_name' },
      age: { type: 'INTEGER', default: 0, name: 'age' },
      gender: { type: 'TEXT', default: expect.any(Function), name: 'gender' },
      profile: {
        type: 'TEXT',
        decode: expect.any(Function),
        encode: expect.any(Function),
        name: 'profile',
      },
    });
  });
  it('should return defined column schema', async () => {
    const col = Customer.getColumn('id');
    expect(col).toEqual({
      type: 'INTEGER',
      pk: true,
      autoIncrement: true,
      name: 'id',
    });
  });
  it('should able to encode value', () => {
    const value = Customer.encode<string>('profile', { bar: 'foo' });
    expect(typeof value === 'string').toBe(true);
    expect(value).toEqual('{"bar":"foo"}');
  });
  it('should able to decode value', () => {
    const value = Customer.decode<{ bar: 'foo' }>('profile', '{"bar":"foo"}');
    expect(value).toEqual({ bar: 'foo' });
  });
  it('should return model attributes', () => {
    const user = new CustomerModel();
    user.username = 'Patrick';
    const attrs = user.getAttrs();
    expect(attrs).toEqual({ username: 'Patrick' });
  });
  it('should return model attribute', () => {
    const user = new CustomerModel();
    user.age = 123;
    const age = user.getAttr('age');
    expect(age).toEqual(123);
  });
  it('should set model attribute success', () => {
    const user = new CustomerModel();
    user.setAttr('age', 1);
    const age = user.getAttr('age');
    expect(age).toEqual(1);
  });
  it('should convert object data to map schema type', () => {
    const row = Customer.purify({ age: 1, profile: { bar: 'quz' } });
    expect(row).toEqual({ age: 1, profile: '{"bar":"quz"}' });
  });
  it('should convert model purify object data', () => {
    const row = Customer.toRowData({ age: 1, username: 'Achilles' });
    expect(row).toEqual({ age: 1, user_name: 'Achilles' });
  });
  it('should convert row data to attribute name', () => {
    const row = Customer.toProps({ age: 1, user_name: 'Achilles' });
    expect(row).toEqual({ age: 1, username: 'Achilles' });
  });
  it('should to clone model', () => {
    const m = Customer.clone();
    expect(m).toBeInstanceOf(CustomerModel);
    expect(m).not.toBe(Customer);
  });
  it('it should return an instance which attached data', () => {
    const user = new CustomerModel();
    const instance = user.instance({
      id: 1,
      user_name: 'Achiles',
      age: 10000,
      gender: 'unknown',
      profile: '{"bar":"quz"}',
    });
    expect(instance).toBeInstanceOf(CustomerModel);
    expect(instance).not.toBe(user);
  });
  it('it should able to export model attributes', () => {
    const user = new CustomerModel();
    const instance = user.instance({
      id: 1,
      user_name: 'Achiles',
      age: 10000,
      gender: 'unknown',
      profile: '{"bar":"quz"}',
    });
    const obj = instance.toObject();
    expect(obj).toEqual({
      id: 1,
      username: 'Achiles',
      age: 10000,
      gender: 'unknown',
      profile: { bar: 'quz' },
    });
  });
  it('should able to create a new user record', async () => {
    const user = (await Customer.create({
      username: randomUUID(),
      age: 100,
      gender: randomUUID(),
      profile: { bar: 'quz' },
    })) as CustomerModel;
    expect(user.id).toBeTruthy();
    const cur = (await Customer.findById(user.id)) as CustomerModel;
    expect(cur.id).toBe(user.id);
  });
  it('should return user records', async () => {
    await Customer.create({
      username: 'SpongBob',
      age: 10001,
      gender: 'unknown',
      profile: { bar: 'quz' },
    });
    const users = await Customer.find({
      username: 'SpongBob',
      age: 10001,
      gender: 'unknown',
    });
    expect(users.length).toBeGreaterThan(0);
  });
  it('should able to update record', async () => {
    const user = (await Customer.create({
      username: randomUUID(),
      age: 10001,
      gender: 'unknown',
      profile: { bar: 'quz' },
    })) as CustomerModel;
    const newName = randomUUID();
    const res = await Customer.update(
      { id: user.id },
      {
        username: newName,
      },
    );
    expect(res).toEqual({
      changes: 1,
      lastID: user.id,
      stmt: { stmt: { changes: 1, lastID: user.id } },
    });
  });
});
