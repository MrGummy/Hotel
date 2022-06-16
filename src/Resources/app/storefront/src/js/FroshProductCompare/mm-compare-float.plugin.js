import DeviceDetection from 'src/helper/device-detection.helper';
import Toastify from 'toastify-js';
import CompareFloatPlugin from '../../../../../../../../FroshProductCompare/src/Resources/app/storefront/src/plugin/compare-float.plugin';
import CompareLocalStorageHelper from '../../../../../../../../FroshProductCompare/src/Resources/app/storefront/src/helper/compare-local-storage.helper';

export default class MMCompareFloatPlugin extends CompareFloatPlugin {
  init() {
    this._button = this.el.querySelector(this.options.buttonSelector);
    this._defaultPadding = window.getComputedStyle(this._button).getPropertyValue('bottom');
    this._badge = this._button.querySelector('.compare-badge');

    this._updateButtonCounter(CompareLocalStorageHelper.getAddedProductsList());
    this._registerEvents();
  }

  _registerEvents() {
    const submitEvent = DeviceDetection.isTouchDevice() ? 'touchstart' : 'click';

    if (this._button) {
      this._button.addEventListener(submitEvent, () => {
        this._openOffcanvas();
        this.$emitter.publish('onClickCompareFloatButton');
      });
    }

    document.$emitter.subscribe('beforeAddProductCompare', event => {
      const { productCount } = event.detail;

      if (productCount >= CompareLocalStorageHelper.maximumCompareProducts && this.options.modalEnabled) {
        Toastify({
          text: this.options.maximumNumberCompareProductsText,
          duration: 2500,
          close: true,
          gravity: 'top',
          position: 'right',
          stopOnFocus: true,
          className: 'toast',
          onClick: () => this._openOffcanvas(),
        }).showToast();
      }
    });

    document.$emitter.subscribe('changedProductCompare', event => {
      this._updateButtonCounter(event.detail.products);
    });

    document.addEventListener('scroll', this._debouncedOnScroll, false);
    const observer = new MutationObserver(this._addBodyPadding.bind(this));
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style'],
    });
  }

  _updateButtonCounter(products) {
    const productNumber = products.length;
    this._badge.innerText = productNumber;

    if (productNumber === 0) {
      this._button.classList.add('d-none');
    } else if (this._button.classList.contains('d-none')) {
      this._button.classList.remove('d-none');
    }
  }
}
