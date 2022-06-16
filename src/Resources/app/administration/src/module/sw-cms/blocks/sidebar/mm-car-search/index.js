const { Application } = Shopware;

Application.getContainer('service').cmsService.registerCmsBlock({
  name: 'mm-car-search',
  label: 'sw-cms.blocks.sidebar.mmCarSearch.label',
  category: 'sidebar',
  component: 'sw-cms-block-category-navigation',
  previewComponent: 'sw-cms-block-preview-category-navigation',
  defaultConfig: {
    marginBottom: '0px',
    marginTop: '0px',
    marginLeft: '0px',
    marginRight: '0px',
    sizingMode: 'boxed',
  },
  slots: {
    content: 'mm-car-search',
  },
});
