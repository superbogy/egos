import { Model, ModelOpts } from '../lib';
import path from 'path';
import assert from 'assert';
import { merge } from '../lib/schema';
const dbFile = path.resolve('./test.db');

const connection = {
  filename: dbFile,
}
class User extends Model {
  _table = 'users';
  constructor(options: ModelOpts) {
    super(options);
  }
}
const model = new User({
  schema: merge({ profile: { type: 'object', encode: JSON.stringify, decode: JSON.parse } }),
  connection,
  debug: true
});
const main = async () => {
  await model.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name CHAR(50) NOT NULL,
  gender CHAR(10) CHECK(gender IN('male', 'female', 'unknown')) NOT NULL,
  mail CHAR(128) NOT NULL,
  age INT NOT NULL,
  profile  TEXT NOT NULL DEFAULT '',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);
  model.create({
    name: 'tommy',
    gender: 'male',
    age: 30,
    mail: 'tommy@hello.cc',
    profile: { bar: 'foo', quiz: 'biz' }
  });

  const user = await model.findOne({ id: { $gte: 1, $lte: 200 } },
    { order: { id: 'desc', age: 'asc' } }) as User;
  console.log(user.toJSON());
  assert(typeof user.profile === 'object')
  const check = (await user.findById(user.id)) as User;
  console.log('check findById %j', check.toObject());
  const u2 = await model.upsert({
    id: user.id + 1,
    name: 'tommy',
    gender: 'male',
    age: user.age + 1,
    mail: 'tommy@hello.cc',
    profile: { bar: 'quz', quiz: 'biz' }
  });
  u2.gender = 'female';
  console.log('user2', u2.toJSON());
  await u2.save();
  assert(u2.age === user.age + 1);
  const updated = await u2.updateAttributes({ name: 'tommy2' });
  assert(updated.name === 'tommy2')
  console.log('updated result %j', updated);
  const removed = await user.remove();
  console.log('removed result %j', removed);
  const checkRemoved = await user.findById(user.id);
  assert(checkRemoved === null);
  console.log('check removed result', checkRemoved);

};


main().then(() => process.exit(0));