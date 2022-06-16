import MollieApplePayPaymentMethod from '../../../../../../../../MolliePayments/src/Resources/app/storefront/src/mollie-payments/plugins/apple-pay-payment-method.plugin';

export default class MMMollieApplePayPaymentMethod extends MollieApplePayPaymentMethod {
  hideApplePay(innerIdentifier) {
    const elements = document.querySelectorAll(innerIdentifier);

    [...elements].forEach(element => {
      const rootElement = this.getClosest(element, '.payment-method');

      if (!!rootElement && !!rootElement.classList) {
        rootElement.remove();
      }
    });
  }
}
