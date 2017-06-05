
class UI {
  constructor(vrDialog, dialogElement) {
    this._vrDialog = vrDialog;
    this._dialogElement = dialogElement;
  }

  info(message) {
    this._show('info', message);
  }

  success(message) {
    this._show('success', message);
  }

  fatal(message) {
    this._show('fatal', message);
  }

  _show(kind, message) {
    this._dialogElement.innerText = message;
    this._dialogElement.setAttribute('class', kind);
    setTimeout(() => {
      console.log(kind, message);
      this._vrDialog.components['ui-dialog'].show();
    }, 16);
  }
}

export { UI };
