
class UI {
  constructor(vrDialog, dialogElement) {
    this._vrDialog = vrDialog;
    this._dialogElement = dialogElement;
  }

  info(message) {
    console.log(message);
    this._show('info', message);
  }

  success(message) {
    this._show('success', message);
  }

  fatal(message) {
    this._show('fatal', message);
  }

  _show(kind, { text, anchor }) {
    this._dialogElement.innerText = text;
    this._dialogElement.setAttribute('class', kind);
    this._vrDialog.setAttribute('position', anchor);
    setTimeout(() => {
      this._vrDialog.components['ui-dialog'].show();
    }, 16);
  }
}

export { UI };
