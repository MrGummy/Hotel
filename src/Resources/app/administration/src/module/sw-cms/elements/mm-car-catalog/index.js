Shopware.Service('cmsService').registerCmsElement({
  name: 'mm-car-catalog',
  label: 'sw-cms.elements.mmCarCatalog.label',
  component: 'sw-cms-el-category-navigation',
  configComponent: 'sw-cms-el-config-category-navigation',
  previewComponent: 'sw-cms-el-preview-category-navigation',
  disabledConfigInfoTextKey: 'sw-cms.elements.sidebarCategoryNavigation.infoText.navigationElement',
});
