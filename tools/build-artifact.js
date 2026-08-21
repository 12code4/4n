#!/usr/bin/env node
/* Artifact build: like build.js, but emits ONLY the page content (inlined
 * <style> + body markup + inlined <script>s) with no <!doctype>/<html>/<head>/
 * <body> wrappers, for publishing via the Artifact tool. */
'use strict';
var fs = require('fs');
var path = require('path');
var ROOT = path.join(__dirname, '..');
var html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// inline css
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, function (_, href) {
  return '<style>\n' + fs.readFileSync(path.join(ROOT, href), 'utf8') + '\n</style>';
});
// inline js
html = html.replace(/<script src="([^"]+)"><\/script>/g, function (_, src) {
  var js = fs.readFileSync(path.join(ROOT, src), 'utf8').replace(/<\/script>/gi, '<\\/script>');
  return '<script>\n' + js + '\n</script>';
});

// pull out <head> inner (minus the charset/viewport/title meta the wrapper owns)
// and the <body> inner; concatenate as bare page content.
var headInner = (html.match(/<head[^>]*>([\s\S]*?)<\/head>/i) || [, ''])[1];
var bodyInner = (html.match(/<body[^>]*>([\s\S]*?)<\/body>/i) || [, ''])[1];
// keep the <style> from head; drop meta/link/title (wrapper provides them)
var styleBlock = (headInner.match(/<style>[\s\S]*?<\/style>/i) || [''])[0];

var out = styleBlock + '\n' + bodyInner.trim();
var dist = path.join(ROOT, 'dist');
if (!fs.existsSync(dist)) fs.mkdirSync(dist);
var file = path.join(dist, 'gilded-maw-artifact.html');
fs.writeFileSync(file, out);
console.log('Built ' + file + ' (' + Math.round(out.length / 1024) + ' KB)');
