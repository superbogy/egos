# liteModel
:fairy: lite model for sqlite, mongodb like driver API. make life easy. :surfing_man:

### get start 
`npm i lite-model` or `yarn add lite-model`

Create a table
```
CREATE TABLE test.users (
  id INT PRIMARY KEY NOT NULL,
  name CHAR(50) NOT NULL,
  gender CHAR(10) CHECK(gender IN('male', 'female', 'unknown')) NOT NULL,
  mail CHAR(128) NOT NULL,
  age INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
);

```

**insert data**

```
const Model = require('lite-model');
const model = new Model('test.db', 'users');
model.insert({
  name: 'tom',
  gender: 'male',
  age: 30,
  mail: 'tommy@hello.cc',
});

model.insert({
  name: 'jerry',
  gender: 'female',
  age: 31,
  mail: 'jerry@world.cc',
});
```


**update date**:
```
const res = model.update({id: 1}, { name: 'Tommy'});
console.log(res);
```

**query**:
```
const res = model.findOne({ where: { id: 1 }});
console.log(res);

const users = model.find({
  where: { id: {$gte: 1 } },
  limit: 10,
  offset: 1,
  order: { age: 'desc' }
})
console.log(users);
```

**delete**

```
const res = model.findOne({ id: 1 });
console.log(res);

```