import Plugin from 'src/plugin-system/plugin.class';
import StoreApiClient from 'src/service/store-api-client.service';
import DomAccess from 'src/helper/dom-access.helper';
import qs from 'qs';

export default class MMLastOrderHelperPlugin extends Plugin {
  static options = {
    baseUrl: window.location.origin,
    route: null,
    orderWarningSelector: '[data-last-order-warning]',
  };

  async init() {
    this.client = new StoreApiClient();

    const lastOrderId = await this.getLastOrder();
    if (!lastOrderId) return;

    this.showWarningBadges();
  }

  showWarningBadges() {
    try {
      const lastOrderWarningBadges = DomAccess.querySelectorAll(document, this.options.orderWarningSelector);
      [...lastOrderWarningBadges].forEach(node => node.classList.remove('d-none'));
    } catch (e) {}
  }

  _cartIsEmpty() {
    return new Promise(resolve => {
      this.client.get('/store-api/checkout/cart', response => {
        const cart = JSON.parse(response);

        resolve(!cart.lineItems.length);
      });
    });
  }

  getLastOrder() {
    const query = qs.stringify({
      limit: 1,
      sort: [
        {
          field: 'orderDateTime',
          order: 'DESC',
        },
      ],
    });

    return new Promise(resolve => {
      this.client.get(`/store-api/order?${query}`, response => {
        const { orders } = JSON.parse(response);

        try {
          const orderStatus = orders.elements[0].technicalName;
          const orderId = orders.elements[0].id;

          switch (orderStatus) {
            case 'paid':
            case 'paid_partially':
            case 'refunded':
            case 'refunded_partially':
            case 'authorized':
              resolve();
              break;

            default:
              resolve(orderId);
              break;
          }
        } catch (e) {
          resolve();
        }
      });
    });
  }
}
