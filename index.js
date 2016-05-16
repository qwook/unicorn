'use strict'

const fs = require('fs');
const path = require('path');
const doT = require('dot');

const babel = require('babel-core');
const gaze = require('gaze');
const tinylr = require('tiny-lr');

// builders
const HTMLBuilder = require('./builders/HTMLBuilder.js');

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

const indexTemplate = doT.template(fs.readFileSync(path.join( __dirname, 'index.html' )));

const execFile = require('child_process').execFile;

class UnicornServer {
  constructor() {
    this.tinylr = tinylr({port: 35729});
    this.child = null;

    this.tinylr.listen(35729);
  }

  start() {
    return this.restart();
  }

  restart() {
    if (this.child) {
      this.child.kill();
    }

    return new Promise((resolve, reject) => {
      this.child = execFile('node', ['./server.js'], (error, stdout, stderr) => {});

      this.child.stdout.on('data', function(data) {
        if (data.indexOf('Server listening on') >= 0) {
          resolve();
        }
      })

      this.child.stdout.pipe(process.stdout);
      this.child.stderr.pipe(process.stderr);
    })
  }

  livereload(files) {
    this.tinylr.changed({body: {files: files}});
  }
}

const server = new UnicornServer();

class UnicornBuilder {

  constructor(dir) {
    this.rootDir = null;
    this.buildDir = null;

    this.coreDir = "./lib";

    this.coreFiles = [];

    this.files = [];
    this.jsFiles = [];
    this.templateFiles = [];

    this.findBuildDir(dir);
    this.watchFiles();
  }

  finalize(file) {
    file = file || "";

    return this.writeBuildFile('index.html', indexTemplate.apply(this))
    .then(() => {
      var jsFileList = this.jsFiles.map((value) => { return '"' + value + '"'; }).join(',');
      var templateFileList = this.templateFiles.map((value) => { return '"' + value + '"'; }).join(',');

      return this.writeBuildFile('bundle.js',
        'require([\'core/index.js\'], function() {' +
          'require([' + templateFileList + '], function() {' +
            'require([' + jsFileList + '], function() {' +
              'console.log("Loaded!");' +
              'Unicorn.loaded();' +
            '})' +
          '})' +
        '})'
      );
    })
    .then(() => {
      console.log("Rebuilt App");
      return server.start();
    })
    .then(() => {
      console.log("Reloaded Clients");
      server.livereload([file]);
    })
    .catch((err) => {
      console.error(err.stack);
    });
  }

  build() {

    // build
    console.log("Building...");

    return this.iterateDir(this.coreDir, "core")
    .then(() => {
      return this.iterateDir(this.rootDir, "app")
    })
    .then(() => {
      return this.finalize();
    })

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

    if ( files.indexOf('unicorn.json') >= 0 ) {
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

  buildFile(file, type) {
    var ext = path.extname(file);
    var relativeFilename = path.relative(this.rootDir, file);

    if (type == "app") {
      relativeFilename = path.join( 'app', relativeFilename );
    } else if (type == "core") {
      relativeFilename = path.join( 'core', path.relative( 'lib', file ) );
    }

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
            var compiled = HTMLBuilder(content);

            relativeFilename = this.changeExt(relativeFilename, '.html.js');

            this.writeBuildFile(relativeFilename, compiled).then(resolve);
            this.templateFiles.push(relativeFilename);
          } else if (ext === ".js") {

            if (type == 'core') {
              var result = babel.transform(content, {
                'filename': relativeFilename,
                'moduleId': relativeFilename,
                'sourceMap': true,
                'plugins': ['transform-es2015-modules-amd', 'transform-es2015-classes', 'transform-es2015-arrow-functions', 'transform-es2015-block-scoped-functions', 'transform-es2015-block-scoping']
              });

              var code = result.code;
              code += '\n//# sourceMappingURL=/' + relativeFilename + '.map';

              this.writeBuildFile(relativeFilename, code).then(resolve);
              this.writeBuildFile(relativeFilename + '.map', JSON.stringify(result.map));

              if (this.coreFiles.indexOf(relativeFilename) == -1)
                this.coreFiles.push(relativeFilename);
            } else {
              this.writeBuildFile(relativeFilename, content).then(resolve);
              if (this.jsFiles.indexOf(relativeFilename) == -1)
                this.jsFiles.push(relativeFilename);
            }

          } else {
            resolve();
          }

        }
      });
    });
  }

  iterateFile(file, type) {
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
              this.iterateDir(file, type);
              resolve();
            }
          } else if (stats.isFile()) {
            this.buildFile(file, type).then(resolve);
          } else {
            // Do nothing?
            resolve();
          }
        }

      });
    });
  }

  iterateDir(dir, type) {
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
        return this.iterateFile(path.join(dir, file), type);
      }));
    });
  }

  watchFiles() {

    var _this = this;

    gaze('lib/**/*.*', function(err, watcher) {
      if (err) {
        throw err;
      }

      this.on('changed', function(file) {
        var relativeFilename = path.relative(__dirname, file);
        console.log(relativeFilename);
        _this.buildFile(relativeFilename, 'core')
        .then(() => {
          return _this.finalize(file);
        });
      });

      this.on('added', function(file) {
        var relativeFilename = path.relative(__dirname, file);
        console.log(relativeFilename);
        _this.buildFile(relativeFilename, 'core')
        .then(() => {
          return _this.finalize(file);
        });
      });
      
      this.on('deleted', function(file) {

      });
      
    });

    gaze(_this.rootDir + '/**/*.*', function(err, watcher) {
      if (err) {
        throw err;
      }

      this.on('changed', function(file) {
        var relativeFilename = path.relative(__dirname, file);
        console.log(relativeFilename);
        _this.buildFile(relativeFilename, 'app')
        .then(() => {
          return _this.finalize(file);
        });
      });

      this.on('added', function(file) {
        var relativeFilename = path.relative(__dirname, file);
        console.log(relativeFilename);
        _this.buildFile(relativeFilename, 'app')
        .then(() => {
          return _this.finalize(file);
        });
      });
      
      this.on('deleted', function(file) {
      });
      
    });
  }

}

const app = new UnicornBuilder('.');
app.build();
