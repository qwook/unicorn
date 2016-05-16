
class UnicornCore {
  loaded() {
    Router.go(window.location.pathname, true);
  }
};

module.exports = new UnicornCore();
