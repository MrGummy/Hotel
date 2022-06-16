import Plugin from 'src/plugin-system/plugin.class';
import DomAccessHelper from 'src/helper/dom-access.helper';
import StoreApiClient from 'src/service/store-api-client.service';
import PageLoadingIndicatorUtil from 'src/utility/loading-indicator/page-loading-indicator.util';

export default class MMSubmitOrderPlugin extends Plugin {
  static options = {
    submitOrderFormSelector: '[data-submit-order-btn]',
    tosSelector: '[data-mm-tos]',
    orderPreventerSelector: '[data-mm-payment-prevented]',
    messengersFormSelector: '[data-mm-messengers]',
    paymentMethodSelector: '.payment-method-input',
    initialPaymentMethodId: null,
    url: '/checkout/confirm',
  };

  init() {
    this._container = document.querySelector('.checkout');

    this.client = new StoreApiClient();
    this.changeEvent = new CustomEvent('change', { bubbles: true, cancelable: true });

    this.submitBtn = DomAccessHelper.querySelector(this.el, this.options.submitOrderFormSelector);
    this.tos = DomAccessHelper.querySelector(document, this.options.tosSelector);
    this.el.addEventListener('submit', this._onConfirm.bind(this));

    this.registerPreventers();
    this.watchPaymentMethods();

    this.isInitialPaymentMethodAvailable() ? this.enableMethod() : this.enableFirstAvailableMethod();
  }

  _onConfirm() {
    this.showMessage(this.submitBtn.dataset.submitOrderProcessComment);
    this.submitBtn.classList.add('disabled');
  }

  registerPreventers() {
    try {
      this.preventer = DomAccessHelper.querySelectorAll(document, this.options.orderPreventerSelector);

      [...this.preventer].forEach(preventer => {
        preventer.addEventListener('change', this._parsePreventers.bind(this));
      });
    } catch (error) {}
  }

  _parsePreventers(e) {
    switch (e.target.dataset.mmPaymentPrevented) {
      case 'amazon':
        this.disableSubmit();
        break;

      default:
        this.enableSubmit();
        break;
    }
  }

  _parseMessengers() {
    const formData = [...this.messengers].reduce((acc, cur) => {
      if (cur.value) {
        const messenger = {
          label: cur.dataset.label,
          content: cur.value,
        };

        acc = [...acc, messenger];
      }

      return acc;
    }, []);

    this.messengersForm.value = JSON.stringify(formData);
  }

  disableSubmit() {
    this.submitBtn.disabled = true;
    this.submitBtn.classList.add('disabled');
  }

  enableSubmit() {
    this.submitBtn.disabled = false;
    this.submitBtn.classList.remove('disabled');
  }

  hide(el) {
    el.classList.add('d-none');
  }

  show(el) {
    el.classList.remove('d-none');
  }

  showMessage(msg) {
    this.submitBtn.textContent = '';
    this.submitBtn.insertAdjacentHTML(
      'afterbegin',
      `<div class="button-text">
        ${msg}
       </div>
       <div class="mm-loader">
         <span></span>
         <span></span>
         <span></span>
       </div>`
    );
  }

  watchPaymentMethods() {
    this.paymentMethods = DomAccessHelper.querySelectorAll(document, this.options.paymentMethodSelector);

    this.paymentMethods.forEach(method => method.addEventListener('change', e => this.setPaymentMethod(e)));
  }

  enableMethod() {
    const enabledMethod = [...this.paymentMethods].find(method => method.value === this.options.initialPaymentMethodId);
    enabledMethod.dispatchEvent(this.changeEvent);
  }

  enableFirstAvailableMethod() {
    this.paymentMethods[0] ? this.paymentMethods[0].dispatchEvent(this.changeEvent) : null;
  }

  isInitialPaymentMethodAvailable() {
    return [...this.paymentMethods].some(method => method.value === this.options.initialPaymentMethodId);
  }

  setPaymentMethod(e) {
    const paymentMethodId = e.target.value;

    if (this.options.initialPaymentMethodId === paymentMethodId) {
      return;
    }

    const data = JSON.stringify({ paymentMethodId });

    PageLoadingIndicatorUtil.create();
    this.client.patch('/store-api/context', data, () => {
      this._getNewPageContent();
    });
  }

  _getNewPageContent() {
    fetch(this.options.url)
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();

        const doc = parser.parseFromString(html, 'text/html');
        const container = doc.querySelector('.checkout');

        this._container.parentNode.replaceChild(container, this._container);

        PluginManager.initializePlugins();
      })
      .finally(() => PageLoadingIndicatorUtil.remove());
  }
}
