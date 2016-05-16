
class RouterCore {
  constructor() {
    this.paths = {};
  }

  route(path, fn) {
    this.paths[path] = fn;
  }

  go(path, noPush) {
    if (this.paths[path]) {
      this.paths[path]();
    }

    if (!noPush) {
      window.history.pushState({}, path, path);
    }
  }
}

module.exports = new RouterCore();
