
class UnicornCore {
  loaded() {
    Router.go(window.location.pathname);
  }
};

module.exports = new UnicornCore();
