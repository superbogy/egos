import { Model, connect, table, column } from '../src';
import path from 'path';
import assert from 'assert';
import { FieldTypes, merge } from '../src/schema';
import 'reflect-metadata';
import { genSql } from '../src/utils';

const dbFile = '';
@connect({ name: 'default', filename: dbFile })
@table('users')
class User extends Model {
  @column({ type: FieldTypes.INT, pk: true, autoIncrement: true })
  id: number;
  @column({ type: FieldTypes.TEXT, default: '""' })
  name: string;
  @column({ type: FieldTypes.INT })
  age: number;
  @column({ type: FieldTypes.TEXT })
  gender: string;
  @column({ type: FieldTypes.TEXT })
  mail: string;
  @column({ type: FieldTypes.TEXT, decode: JSON.parse, encode: JSON.stringify })
  profile: string;
}

const main = async () => {
  const user = new User({ debug: true, timestamp: true });
  console.log(user.schema);
  const sql = genSql(user.table, user.schema);
  await user.exec(sql);
  const current = await user.create({
    name: 'tommy',
    gender: 'male',
    age: 30,
    mail: 'tommy@hello.cc',
    profile: { bar: 'foo', quiz: 'biz' },
  });
  const cur = await user.findById(current.id);
  console.log(cur.toObject());
  // const con = {
  //   $or: [
  //     { $and: [{ name: 1 }, { age: 2 }] },
  //     { $or: [{ mail: 2 }, { gender: 'male' }] },
  //   ],
  // };
  // const c1 = {
  //   $and: [{ mail: 2 }, { gender: 'male' }],
  //   $or: [{ name: 1 }, { age: 2 }],
  // };
  // console.log('%j', con);
  // const c = { age: 1, name: 2, gender: 3 };
  // const orQuery = await user.findOne(con);
  // console.log(orQuery);
  return;
  const user1 = (await user.findOne(
    { id: { $gte: 1, $lte: 200 } },
    { order: { id: 'desc', age: 'asc' } },
  )) as User;
  console.log(user1);
  user1.name = 'tom';
  const user2 = await user1.save();
  console.log(user2.name); // tom
  assert(typeof user1.profile === 'object');
  const check = await user.findById(user1.id);
  console.log('check findById %j', check.toObject());
  const u2 = await user.upsert({
    id: user1.id + 1,
    name: 'tommy',
    gender: 'male',
    age: user1.age + 1,
    mail: 'tommy@hello.cc',
    profile: { bar: 'quz', quiz: 'biz' },
  });
  u2.gender = 'female';
  console.log('user2', u2.toJSON());
  await u2.save();
  assert(u2.age === user1.age + 1);
  const updated = await u2.updateAttributes({ name: 'tommy2' });
  assert(updated.name === 'tommy2');
  console.log('updated result %j', updated);
  const removed = await user1.remove();
  console.log('removed result %j', removed);
  const checkRemoved = await user.findById(user1.id);
  assert(checkRemoved === null);
  console.log('check removed result', checkRemoved);
};

main().then(() => process.exit(0));
