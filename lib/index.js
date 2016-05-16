
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

  CLIENT = false;
}

glob.Template = Template;
glob.Router = Router;
glob.Unicorn = Unicorn;

if (CLIENT) {
  window.addEventListener('click', function(event) {
    console.log(event.target);
  });
}
