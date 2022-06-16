const { join, resolve } = require('path');

module.exports = () => {
  return {
    resolve: {
      alias: {
        vue: resolve(join(__dirname, '../../../../../', 'node_modules', 'vue/dist/vue.esm-browser.prod')),
        inputmask: resolve(join(__dirname, '../../../../../', 'node_modules', 'inputmask')),
        delayt: resolve(join(__dirname, '../../../../../', 'node_modules', 'delay')),
        'toastify-js': resolve(join(__dirname, '../../../../../', 'node_modules', 'toastify-js')),
        'p-limit': resolve(join(__dirname, '../../../../../', 'node_modules', 'p-limit')),
        'p-debounce': resolve(join(__dirname, '../../../../../', 'node_modules', 'p-debounce')),
        'vue-demi': resolve(join(__dirname, '../../../../../', 'node_modules', 'vue-demi')),
        '@vueuse/shared': resolve(join(__dirname, '../../../../../', 'node_modules', '@vueuse/shared/index.cjs')),
        '@vueuse/core': resolve(join(__dirname, '../../../../../', 'node_modules', '@vueuse/core/index.cjs')),
        '@vueform/multiselect': resolve(join(__dirname, '../../../../../', 'node_modules', '@vueform/multiselect')),
        'vue-height-collapsible/vue3': resolve(
          join(__dirname, '../../../../../', 'node_modules', 'vue-height-collapsible/vue3/vue-height-collapsible.esm')
        ),
        '@chenfengyuan/vue-number-input': resolve(
          join(__dirname, '../../../../../', 'node_modules', '@chenfengyuan/vue-number-input/dist/vue-number-input.esm')
        ),
      },
    },
  };
};
