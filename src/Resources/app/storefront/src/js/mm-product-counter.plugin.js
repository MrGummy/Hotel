import Plugin from 'src/plugin-system/plugin.class';
import StoreApiClient from 'src/service/store-api-client.service';

import { createApp, ref, onMounted, computed, watch } from 'vue';
import { useGlobalCars, useGlobalProductCounter } from './utils/store';

export default class MMProductCounterPlugin extends Plugin {
  async init() {
    this.client = new StoreApiClient();

    this._runApp();
  }

  _runApp() {
    const _ = this;

    const App = {
      setup() {
        const { value: garage } = useGlobalCars();
        const { value: counter } = useGlobalProductCounter();

        function loadCount() {
          return new Promise(resolve => {
            _.client.get(`/store-api/productCounts/categories`, response => {
              resolve(JSON.parse(response));
            });
          });
        }

        async function setCatalog() {
          counter.loading = true;
          counter.list = garage.loading
            ? []
            : await loadCount()
                .then(res =>
                  res.map(el => {
                    return {
                      productCount: el.products_count,
                      categoryId: el.category_id.toLowerCase(),
                    };
                  })
                )
                .then(list => {
                  document.$emitter.publish('CountChanged', list);

                  return list;
                })
                .catch(() => {});

          counter.loading = false;
        }

        onMounted(() => {
          setCatalog();

          watch(
            () => garage.loading,
            () => setCatalog()
          );
        });
      },
    };

    this._app = createApp(App);
    this._app.mount('#catalog-counter-app');
  }
}
