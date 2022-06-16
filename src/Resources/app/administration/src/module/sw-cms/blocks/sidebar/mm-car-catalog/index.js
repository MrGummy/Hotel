const { Application } = Shopware;

Application.getContainer('service').cmsService.registerCmsBlock({
  name: 'mm-car-catalog',
  label: 'sw-cms.blocks.sidebar.mmCarCatalog.label',
  category: 'sidebar',
  component: 'sw-cms-block-category-navigation',
  previewComponent: 'sw-cms-block-preview-category-navigation',
  defaultConfig: {
    marginBottom: '0px',
    marginTop: '0px',
    marginLeft: '0px',
    marginRight: '0px',
    sizingMode: 'full_width',
  },
  slots: {
    content: 'mm-car-catalog',
  },
});
