
class RouterCore {
  constructor() {
    this.paths = {};
  }

  route(path, fn) {
    this.paths[path] = fn;
  }

  go(path) {
    this.paths[path]();
    console.log('we go to this path ', path);
  }
}

module.exports = new RouterCore();
