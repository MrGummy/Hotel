import ListingPlugin from 'src/plugin/listing/listing.plugin';
import ElementReplaceHelper from 'src/helper/element-replace.helper';
import Storage from 'src/helper/storage/storage.helper';

export default class MMListingPlugin extends ListingPlugin {
  _buildRequest(pushHistory = true, overrideParams = {}) {
    const stored = Storage.getItem('crw-garage');
    const garage = JSON.parse(stored);
    const kType = garage.active ? garage.active : null;

    const params = { ...overrideParams, kType };

    super._buildRequest(pushHistory, params);
  }

  renderResponse(response) {
    document.$emitter.publish('Listing/beforeRenderResponse');
    ElementReplaceHelper.replaceFromMarkup(response, this.options.cmsProductListingSelector, false);

    this._registry.forEach(item => {
      if (typeof item.afterContentChange === 'function') {
        item.afterContentChange();
      }
    });

    this.$emitter.publish('Listing/afterRenderResponse', { response });
    document.$emitter.publish('Listing/afterRenderResponse');

    this.refreshRegistry();
  }
}
