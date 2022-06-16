import Plugin from 'src/plugin-system/plugin.class';
import Iterator from 'src/helper/iterator.helper';

export default class MMProductsCountPlugin extends Plugin {
  static options = {
    categoryIdSelector: '[data-category-id]',
    storageKey: 'crw-catalog-count',
  };

  init() {
    this._categories = this.el.querySelectorAll(this.options.categoryIdSelector);

    this._registerEvents();
  }

  _registerEvents() {
    document.addEventListener('CountChanged', this._setNumbers.bind(this));
  }

  _setNumbers({ detail }) {
    Iterator.iterate(this._categories, category => {
      if (!detail) {
        category.innerHTML = '';

        return;
      }

      const storedEl = detail.find(el => el.categoryId === category.dataset.categoryId);

      if (storedEl) {
        category.innerHTML = +storedEl.productCount;
      } else {
        category.innerHTML = '';
      }
    });
  }
}
