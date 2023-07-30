import { Builder } from './builder';

describe('Builder', () => {
  // select * from bar left join foo on bar.name = foo.username
  // where bar.id=1 and foo.pid=2
  it('should able to join table', () => {
    const builder = new Builder('foo');
    const { sql, params } = builder
      .fields(['name'], 'bar')
      .fields(['username'], 'foo')
      .LeftJoin('bar', { name: 'newName' })
      .where(
        {
          'bar.id': 1,
          'foo.pid': 2,
        },
        '',
      )
      .select();

    expect(sql).toEqual(
      'SELECT bar.name,foo.username FROM `foo` LEFT JOIN bar ON foo.name=bar.newName WHERE ((bar.id = ? AND foo.pid = ?))',
    );
    expect(params).toEqual([1, 2]);
  });
});
