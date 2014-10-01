var assert = require('assert');

var findGitRepos = require('../index');

findGitRepos('test/fixture-3-repos', function (err, results) {
  assert.ifError(err);
  assert.equal(3, results.length);
  assert.deepEqual([
    { path: 'test/fixture-3-repos/a', url: 'https://github.com/pose/a' },
    { path: 'test/fixture-3-repos/b', url: 'https://github.com/pose/b' },
    { path: 'test/fixture-3-repos/c', url: 'https://github.com/pose/c' }
  ], results);
});

findGitRepos('test/empty-repos', function (err, results) {
  assert.ifError(err);
  assert.equal(0, results.length);
});


