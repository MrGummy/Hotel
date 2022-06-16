import MMLastOrderHelperPlugin from './js/mm-last-order-helper.plugin';
import MMOffcanvasMenuPlugin from './js/mm-offcanvas-menu.plugin';
import MMSubmitOrderPlugin from './js/mm-submit-order.plugin';
import MMCookiePermissionPlugin from './js/mm-cookie-permission.plugin';
import MMLayoutSwitcherPlugin from './js/mm-layout-switcher.plugin';
import MMCarSearchPlugin from './js/mm-car-search.plugin';
import MMCarWidgetPlugin from './js/mm-car-widget.plugin';
import MMProductFitPlugin from './js/mm-product-fit.plugin';
import MMProductFitLoaderPlugin from './js/mm-product-fit-loader.plugin';
import MMProductCompatibilityPlugin from './js/mm-product-compatibility.plugin';
import MMSearchWidgetPlugin from './js/mm-search-widget.plugin';
import MMListingPlugin from './js/mm-listing.plugin';
import MMQuantityInputPlugin from './js/mm-quantity-input.plugin';
import MMNavigationCounterPlugin from './js/mm-navigation-counter.plugin';
import MMOffcanvasCustomPlugin from './js/mm-offcanvas-custom.plugin';
import MMCarCatalogPlugin from './js/mm-car-catalog.plugin';
import MMProductCounterPlugin from './js/mm-product-counter.plugin';
import MMMollieApplePayPaymentMethod from './js/Mollie/mm-apple-pay-payment-method.plugin';
import MMCountrySelectorPlugin from './js/mm-country-selector.plugin';
import MMCompareFloatPlugin from './js/FroshProductCompare/mm-compare-float.plugin';
import MMCompareWidgetPlugin from './js/FroshProductCompare/mm-compare-widget.plugin';
import MMAddToCompareButtonPlugin from './js/FroshProductCompare/mm-add-to-compare-button.plugin';
import MMStickyHeaderPlugin from './js/mm-sticky-header.plugin';

const PluginManager = window.PluginManager;

PluginManager.override('CookiePermission', MMCookiePermissionPlugin, '[data-cookie-permission]');
PluginManager.override('OffcanvasMenu', MMOffcanvasMenuPlugin, '[data-offcanvas-menu]');
PluginManager.override('SearchWidget', MMSearchWidgetPlugin, '[data-search-form]');

PluginManager.override(
  'MollieApplePayPaymentMethod',
  MMMollieApplePayPaymentMethod,
  '[data-mollie-template-applepay-account]'
);
PluginManager.override(
  'MollieApplePayPaymentMethod',
  MMMollieApplePayPaymentMethod,
  '[data-mollie-template-applepay-checkout]'
);

PluginManager.override('CompareFloat', MMCompareFloatPlugin, '[data-compare-float]');
PluginManager.override('CompareWidget', MMCompareWidgetPlugin, '[data-compare-widget]');
PluginManager.override('AddToCompareButton', MMAddToCompareButtonPlugin, '[data-add-to-compare-button]');

PluginManager.register('SubmitOrder', MMSubmitOrderPlugin, '[data-submit-order]');
PluginManager.register('StickyHeader', MMStickyHeaderPlugin, '[data-sticky-header]');
PluginManager.register('LastOrderHelper', MMLastOrderHelperPlugin, '[data-last-order-helper]');
PluginManager.register('LayoutSwitcher', MMLayoutSwitcherPlugin, '[data-layout-switcher]');
PluginManager.register('QuantityInput', MMQuantityInputPlugin, '[data-quantity-input]');
PluginManager.register('CountrySelector', MMCountrySelectorPlugin, '[data-country-selector]');

PluginManager.register('CarWidget', MMCarWidgetPlugin, '[data-car-widget]');
PluginManager.override('Listing', MMListingPlugin, '[data-listing]');

PluginManager.register('CarSearch', MMCarSearchPlugin, '[data-car-search]');
PluginManager.register('OffcanvasCustom', MMOffcanvasCustomPlugin, '[data-offcanvas-custom]');
PluginManager.register('CarCatalog', MMCarCatalogPlugin, '[data-car-catalog]');

PluginManager.register('ProductFit', MMProductFitPlugin, '[data-product-fit]');
PluginManager.register('ProductCompatibility', MMProductCompatibilityPlugin, '[data-product-compatibility]');

PluginManager.register('NavigationCounter', MMNavigationCounterPlugin, '[data-navigation-counter]');
PluginManager.register('ProductCounter', MMProductCounterPlugin);

PluginManager.register('ProductFitLoader', MMProductFitLoaderPlugin);

if (module.hot) {
  module.hot.accept();
}
