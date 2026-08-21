#!/usr/bin/env node
/* Single-file build: inlines css + js referenced by index.html into
 * dist/the-gilded-maw.html. The script-tag order in index.html is the
 * single source of load order. */
'use strict';
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, function (_, href) {
  var css = fs.readFileSync(path.join(ROOT, href), 'utf8');
  return '<style>\n' + css + '\n</style>';
});

html = html.replace(/<script src="([^"]+)"><\/script>/g, function (_, src) {
  var js = fs.readFileSync(path.join(ROOT, src), 'utf8');
  // </script> inside string literals would break the inline tag; none exist, but guard anyway
  js = js.replace(/<\/script>/gi, '<\\/script>');
  return '<script>\n' + js + '\n</script>';
});

var dist = path.join(ROOT, 'dist');
if (!fs.existsSync(dist)) fs.mkdirSync(dist);
var out = path.join(dist, 'the-gilded-maw.html');
fs.writeFileSync(out, html);
console.log('Built ' + out + ' (' + Math.round(html.length / 1024) + ' KB)');
