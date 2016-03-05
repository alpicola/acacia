class PropertyHook {
  constructor(fn) {
    this.fn = fn;
  }

  hook() {
    this.fn.apply(this, arguments);
  }
}

function propHook(fn) {
  return new PropertyHook(fn);
}

export {propHook}