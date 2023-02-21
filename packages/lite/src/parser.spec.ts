import { Parser } from './parser';
describe('Parser', () => {
  describe('build', () => {
    it('should return single logic node tree', () => {
      const parser = new Parser();
      const tree1 = parser.build({ id: 1, name: 2 });
      expect(tree1).toEqual([{ $and: [{ id: 1, name: 2 }] }]);
      const tree2 = parser.build({ id: { $eq: 1 }, name: 'foo' });
      expect(tree2).toEqual([{ $and: [{ id: { $eq: 1 }, name: 'foo' }] }]);
    });
    it('should return multi logic node tree', () => {
      const parser = new Parser();
      const tree1 = parser.build({
        $and: [{ mail: 2 }, { gender: 'male' }],
        $or: [{ name: 1 }, { age: 2 }],
      });
      expect(tree1).toEqual([
        {
          $and: [
            {
              $and: [{ mail: 2 }, { gender: 'male' }],
              $or: [{ name: 1 }, { age: 2 }],
            },
          ],
        },
      ]);
      const tree2 = parser.build({
        $or: [
          { $and: [{ mail: 2 }, { gender: 'male' }] },
          { $or: [{ name: 1 }, { age: 2 }] },
        ],
      });
      expect(tree2).toEqual([
        {
          $or: [
            { $and: [{ mail: 2 }, { gender: 'male' }] },
            { $or: [{ name: 1 }, { age: 2 }] },
          ],
        },
      ]);
    });
  });
  describe('objectToSql & joinKv', () => {
    it('should string up object kv with operator', () => {
      const parser = new Parser();
      const $inc = parser.joinKV('$inc', 'id', 1);
      expect($inc).toEqual(['id = id + 1', []]);
      const $eq = parser.joinKV('$eq', 'id', 2);
      expect($eq).toEqual(['id = ?', [2]]);
      const $in = parser.joinKV('$in', 'id', [1, 2]);
      expect($in).toEqual(['id IN(?,?)', [1, 2]]);
      const $func = parser.joinKV('max', 'id');
      expect($func).toEqual(['max(id)', []]);
    });
    it('should parse object to sql', () => {
      const parser = new Parser();
      const res = parser.objectToSql({ id: { $eq: 1 }, name: 'foo' });
      expect(res).toHaveProperty('sql', 'id = ? and name = ?');
      expect(res).toHaveProperty('params', [1, 'foo']);
    });
  });
  describe('transform', () => {
    it('should transform correct', () => {
      const parser = new Parser();
      const tree = parser.build({ id: 1, name: 'bar' });
      const after = parser.transform(tree);
      expect(after).toHaveProperty('sql', '((id = ? and name = ?))');
      expect(after).toHaveProperty('params', [1, 'bar']);
    });
    it('should able to transform complex condition', () => {
      const parser = new Parser();
      const tree = parser.build({
        $and: [{ mail: 2 }, { gender: 'male' }],
        $or: [{ name: 1 }, { age: 2 }],
      });
      const after = parser.transform(tree);
      expect(after).toHaveProperty(
        'sql',
        '((mail = ? AND gender = ?) AND (name = ? OR age = ?))',
      );
      expect(after).toHaveProperty('params', [2, 'male', 1, 2]);
    });
  });
  describe('parse', () => {
    it('should able to parse', () => {
      const parser = new Parser();
      const res = parser.parse({ id: 1, age: 2 });
      expect(res).toEqual({ sql: '((id = ? AND age = ?))', params: [1, 2] });
    });
  });
});
