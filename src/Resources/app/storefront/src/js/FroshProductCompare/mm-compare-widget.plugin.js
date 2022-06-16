import CompareWidgetPlugin from '../../../../../../../../FroshProductCompare/src/Resources/app/storefront/src/plugin/compare-widget.plugin';
import CompareLocalStorageHelper from '../../../../../../../../FroshProductCompare/src/Resources/app/storefront/src/helper/compare-local-storage.helper';

export default class MMCompareWidgetPlugin extends CompareWidgetPlugin {
  _registerEvents() {
    document.$emitter.subscribe('removeCompareProduct', event => {
      const table = this.el.querySelector('table');
      const rows = table.rows;

      if (table.querySelectorAll('thead tr td').length === 2) {
        table.style.display = 'none';
        CompareLocalStorageHelper.clear();
        this.insertStoredContent();
        return;
      }

      for (let i = 0; i < rows.length; i += 1) {
        try {
          rows[i].deleteCell(event.detail.product.productRow);
        } catch (e) {
          // nth
        }
      }
    });

    this._clearBtn.addEventListener('click', () => {
      CompareLocalStorageHelper.clear();
      this.fetch();
    });

    this._printBtn.addEventListener('click', () => {
      const body = document.body;
      const footer = document.querySelector('footer');
      const header = document.querySelector('header');
      const nav = document.querySelector('.main-navigation__box');
      const logo = document.querySelector('.logo');
      const cookie = document.querySelector('.cookie-permission-container');

      header.classList.add('hide-on-print');
      footer.classList.add('hide-on-print');
      nav.classList.add('hide-on-print');
      cookie.classList.add('hide-on-print');
      logo.classList.add('show-on-print');

      window.print();

      header.classList.remove('hide-on-print');
      footer.classList.remove('hide-on-print');
      nav.classList.remove('hide-on-print');
      cookie.classList.remove('hide-on-print');
      logo.classList.remove('show-on-print');
    });
  }
}
