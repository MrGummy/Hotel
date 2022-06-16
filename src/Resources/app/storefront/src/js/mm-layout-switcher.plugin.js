import Plugin from 'src/plugin-system/plugin.class';
import Storage from 'src/helper/storage/storage.helper';
import Iterator from 'src/helper/iterator.helper';

export default class MMLayoutSwitcherPlugin extends Plugin {
  static options = {
    storageKey: 'crw-layout',
    layoutSelector: '.layout',
    gridSelector: '.listing-grid-layout',
  };

  init() {
    this._layouts = this.el.querySelectorAll(this.options.layoutSelector);
    this._grid = document.querySelector(this.options.gridSelector);
    this._currentLayout = null;

    this._registerEvents();
    this._setStoredLayout();
  }

  _registerEvents() {
    Iterator.iterate(this._layouts, layout => {
      layout.addEventListener('click', this._onClickLayoutTrigger.bind(this, layout));
    });
  }

  _setStoredLayout() {
    const stored = Storage.getItem(this.options.storageKey);

    if (stored) {
      Iterator.iterate(this._layouts, l => {
        if (l.dataset.layout === stored) {
          this._onClickLayoutTrigger(l);
        }
      });
    }
  }

  _onClickLayoutTrigger(target) {
    const { layout } = target.dataset;

    if (this._currentLayout === layout) {
      return;
    }

    this._grid.classList.remove(`listing-grid-layout--${this._currentLayout}`);
    this._grid.classList.add(`listing-grid-layout--${layout}`);

    Iterator.iterate(this._layouts, l => {
      if (l.dataset.layout === layout) {
        l.classList.add('layout--active');
      } else {
        l.classList.remove('layout--active');
      }
    });

    this._currentLayout = layout;

    Storage.setItem(this.options.storageKey, layout);
  }
}
