import {
  Model,
  connect,
  table,
  column,
  ORDER_TYPE,
  schema,
  Builder,
} from '../src';
import assert from 'assert';
import { FieldTypes } from '../src/schema';
import 'reflect-metadata';
import { genSql } from '../src/utils';
import { addConnection } from '../src/decorators';
import { Database } from 'sqlite3';

const main = async () => {
  console.log(1);
  const builder = new Builder('foo');
  builder.LeftJoin('bar', { name: 'newName' });
};

main();
