var fs = require('fs');
var path = require('path');
var util = require('util');

var ini = require('ini');
var Promise = require('bluebird');

Promise.promisifyAll(fs);

function getUrl(file) {
  var gitConfigFile = path.join(file, '.git', 'config');

  return fs.statAsync(gitConfigFile)
  .then(function (stat) {
    if (!stat.isFile()) { throw new Error('invalid .gitConfig file'); }
    return [gitConfigFile, 'utf8'];
  })
  .spread(fs.readFileAsync.bind(fs))
  .then(function (val) { return ini.parse(val); })
  .then(function (config) {
    var origin = config['remote "origin"'];

    if (!origin.url) { throw new Error('origin URL not found'); }

    return origin.url;
  })
  .then(function (originUrl) {
    var githubPrefixes = ['git@github.com:', 'https://github.com/'];
    var githubSuffix = '.git';

    var matchingPrefixes = githubPrefixes.filter(function (prefix) {
      return originUrl.indexOf(prefix) === 0;
    });

    if (!matchingPrefixes || !matchingPrefixes[0]) {
      throw new Error('Error: prefix not found' + originUrl);
    }

    return 'https://github.com/' + originUrl.slice(matchingPrefixes[0].length, -githubSuffix.length);
  });

}

function findGHProjectsInFolder(folderPath) {
  return fs.statAsync(folderPath).then(function (stat) {
    if (!stat.isDirectory()) { throw new Error('invalid path' + folderPath); }
    return folderPath;
  })
  .then(fs.readdirAsync.bind(fs))
  .then(function (folders) {
    folders = folders.map(function (folder) {
      var p = path.join(folderPath, folder);
      var url = getUrl(p);
      return url.then(function (url) {
        return {path: p, url: url};
      }, function (err) {
        return {};
      });
    });

    return Promise.filter(folders, function (folder) { return folder.path; });
  });
}

module.exports = function (folderPaths, cb) {
  if (!util.isArray(folderPaths)) { folderPaths = [folderPaths]; }

  folderPaths = folderPaths.map(function (folderPath) {
    return findGHProjectsInFolder(folderPath);
  });

  Promise.all(folderPaths).done(function (results) {
    results = Array.prototype.concat.apply([], results);
    cb(null, results);
  }, function (e) {
    cb(e);
  });
};
