import SearchWidgetPlugin from 'src/plugin/header/search-widget.plugin';
import Storage from 'src/helper/storage/storage.helper';
import DomAccess from 'src/helper/dom-access.helper';

export default class MMSearchWidgetPlugin extends SearchWidgetPlugin {
  _registerInputFocus() {}

  _suggest(value) {
    try {
      const stored = Storage.getItem('crw-garage');
      const garage = JSON.parse(stored);
      this._url = `/suggest?kType=${garage.active}&search=`;
    } catch (e) {
      this._url = `/suggest?search=`;
      console.log(e);
    }

    super._suggest(value);
  }

  _handleSearchEvent(event) {
    const kTypeInput = DomAccess.querySelector(this.el, '[data-ktype-input]');

    try {
      const stored = Storage.getItem('crw-garage');
      const garage = JSON.parse(stored);

      kTypeInput.value = garage.active;
    } catch (e) {
      kTypeInput.value = '';
    }

    super._handleSearchEvent(event);
  }
}
