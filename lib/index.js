
import TemplateCore from './template.js';

var glob;
if (typeof window == "undefined") {
  // node
  glob = global;
} else {
  // browser
  glob = window;
}

glob.Template = new TemplateCore();
