
class TemplatePage {

  constructor(fn) {
    this.fn = fn;
  }

  render(scope) {
    return this.fn(scope);
  }

};

class TemplateCore {

  add(name, fn) {
    console.log(fn({}));
    this[name] = new TemplatePage(fn);
  }

  render(name, data) {
    console.log(name);
    console.log(this[name]);
    document.body.innerHTML = this[name].render();
  }

}

module.exports = new TemplateCore();
