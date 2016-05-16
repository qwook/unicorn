'use strict'

const doT = require('dot');
const htmlparser = require('htmlparser');

function domToString(object) {
  var out;

  if (object.type == 'text') {
    return object.raw;
  }

  if (object.type == 'comment') {
    return object.raw + '-->';
  }

  // todo: this htmlparser is good enough that I can write my own templating engine.. hmm
  // :-)
  // might have trouble with source maps

  if (object.children) {

    out = "<" + object.raw + ">";

    for (var child of object.children) {
      out += domToString(child);
    }

    // tag is part of the templating logic!
    if (object.name[0] != "%") {
      out += "</" + object.name + ">";
    }

  } else {
    out = "<" + object.raw + " />";
  }

  return out;
}

module.exports = function(html) {

  var tempString = "";

  var handler = new htmlparser.DefaultHandler((err, dom) => {
    console.log(dom);
    for (var child of dom) {
      if (
        child.type == 'tag' &&
        child.name == 'template'
        ) {

        var tempRaw = '';
        for (var tag of child.children) {
          tempRaw += domToString(tag);
        }

        var tempFn = doT.template(tempRaw);

        tempString += 'Template.add("' + child.attribs.name + '", function(_scope) {' +
          'return (' + tempFn.toString() + ').apply(_scope)' +
        '});\n';
      }
    }
  });

  var parser = new htmlparser.Parser(handler);
  parser.parseComplete(html);

  return tempString;

}
