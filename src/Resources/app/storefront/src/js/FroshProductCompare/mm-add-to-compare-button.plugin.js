import AddToCompareButtonPlugin from '../../../../../../../../FroshProductCompare/src/Resources/app/storefront/src/plugin/add-to-compare-button.plugin';

export default class MMAddToCompareButtonPlugin extends AddToCompareButtonPlugin {
  _toggleText(el, text) {
    if (this.options.showIconOnly) {
      return;
    }

    const textNode = el.querySelector('.compare__text');
    textNode.textContent = text;
  }
}
