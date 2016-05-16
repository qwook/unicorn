'use strict'

var fs = require('fs');
var path = require('path');
var doT = require('dot');

doT.templateSettings = {
  evaluate:    /\<\%([\s\S]+?)\%\>/g,
  interpolate: /\<\%=([\s\S]+?)\%\>/g,
  encode:      /\<\%!([\s\S]+?)\%\>/g,
  use:         /\<\%#([\s\S]+?)\%\>/g,
  define:      /\<\%##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\%\>/g,
  conditional: /\<\%\?(\?)?\s*([\s\S]*?)\s*\%\>/g,
  iterate:     /\<\%~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\%\>)/g,
  varname: 'it',
  strip: true,
  append: true,
  selfcontained: true
};

var indexTemplate = doT.template(fs.readFileSync(path.join( __dirname, 'index.html' )));

class UnicornBuilder {

  constructor(dir) {
    this.rootDir = null;
    this.buildDir = null;

    this.files = [];
    this.jsfiles = [];
    this.templatefiles = [];

    this.findBuildDir(dir);

    // build
    console.log("Building...");
    this.iterateDir(this.rootDir)
    .then(() => {
      return this.writeBuildFile('index.html', indexTemplate.apply(this));
    })
    .then(() => {
      console.log("Done");
    })
    .catch((err) => {
      console.error(err.stack);
    });
  }

  ensureFolder(dir) {
    var dirs = dir.split(path.sep);

    for (var i = 0; i < dirs.length; i++) {
      var _dir = dirs.slice(0, i+1).join(path.sep);

      if (!fs.existsSync(_dir)) {
        fs.mkdirSync(_dir);
      }
    }
  }

  writeBuildFile(file, contents) {
    var buildFileName = path.join(this.rootDir, '.build', file);
    return new Promise((resolve, reject) => {
      this.ensureFolder(path.dirname(buildFileName));

      fs.writeFile(buildFileName, contents, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      })
    });
  }

  findBuildDir(dir) {
    if ( !fs.statSync(dir).isDirectory() ) {
      return;
    }

    var files = fs.readdirSync(dir);

    if ( files.indexOf('unicorn.json') > 0 ) {
      this.rootDir = dir;
      this.buildDir = path.join(dir, '.build');
    } else {
      for (var file of files) {
        this.findBuildDir(path.join( dir, file ));
      }
    }
  }

  changeExt(file, newExt) {
    return path.join( path.dirname(file), path.basename(file, path.extname(file)) + newExt );
  }

  buildFile(file) {
    var ext = path.extname(file);
    var relativeFilename = path.join( 'app', path.relative(this.rootDir, file) );

    return new Promise((resolve, reject) => {

      // ignore if no build dir detected
      if (!this.buildDir) {
        resolve();
      }

      fs.readFile(file, 'utf8', (err, content) => {
        if (err) {
          reject(err);
        } else {
          // todo: allow plugins
          if (ext === ".html") {
            var tempFn = doT.template(content);

            var tempString =
            "function hey(_scope) {" +
            "return (" + tempFn.toString() + ").apply(_scope)" +
            "}";

            relativeFilename = this.changeExt(relativeFilename, '.html.js');

            this.writeBuildFile(relativeFilename, tempString).then(resolve);
            this.templatefiles.push(relativeFilename);
          } else if (ext === ".js") {
            this.writeBuildFile(relativeFilename, content).then(resolve);
            this.jsfiles.push(relativeFilename);
          } else {
            resolve();
          }

        }
      });
    });
  }

  iterateFile(file) {
    return new Promise((resolve, reject) => {
      fs.stat(file, (err, stats) => {

        if (err) {
          reject(err);
        } else {
          if (stats.isDirectory()) {
            // Skip hidden folders
            if (path.basename(file).substring(0, 1) == '.') {
              resolve();
            } else {
              this.iterateDir(file);
              resolve();
            }
          } else if (stats.isFile()) {
            this.buildFile(file).then(resolve);
          } else {
            // Do nothing?
            resolve();
          }
        }

      });
    });
  }

  iterateDir(dir) {
    return new Promise((resolve, reject) => {
      fs.readdir(dir, (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files);
        }
      })
    }).then((files) => {
      return Promise.all(files.map((file) => {
        return this.iterateFile(path.join(dir, file));
      }));
    });
  }

}

var app = new UnicornBuilder('.');

// var tempFn = doT.template(fs.readFileSync('./test.html'));
// console.log(tempFn.toString());

// var _this = {test: "hey"};
// console.log(tempFn.apply(_this));