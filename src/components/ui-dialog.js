
const uiDialog = {
  dependencies: ['visible', 'material'],
  attribute: 'ui-dialog',
  schema: {
    hold: { default: 2 },
    fade: { default: 1 }
  },
  show() {
    this._willShow = true;
  },
  tick(t, dt) {
    if (this._willShow) {
      this.el.setAttribute('visible', 'true');
      this._startTime = t;
      this._willShow = false;
    }
    if (t - this._startTime > this.data.hold * 1000) {
      this.el.setAttribute('visible', 'false');
    }
  }
};

export { uiDialog };
