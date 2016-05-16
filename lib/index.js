
var Template = require('./template.js');
var Router = require('./router.js');
var Unicorn = require('./unicorn.js');

var CLIENT = false;
var SERVER = false;

var glob;
if (typeof window == "undefined") {
  // node
  glob = global;

  SERVER = true;
} else {
  // browser
  glob = window;

  CLIENT = true;
}

glob.Template = Template;
glob.Router = Router;
glob.Unicorn = Unicorn;

if (CLIENT) {
  document.addEventListener('click', function(event) {
    if (event.target && event.target.tagName && event.target.tagName.toLowerCase() == "a") {
      event.preventDefault();

      if (event.target.href.substring(0, window.location.origin.length) == window.location.origin) {
        var path = event.target.href.substring(window.location.origin.length);
        Router.go(path);
      }
    }
  });

  window.onpopstate = function(event) {
    Router.go(window.location.pathname, true);
  }
}
