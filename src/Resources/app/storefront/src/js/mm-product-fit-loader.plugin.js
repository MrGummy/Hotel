import Plugin from 'src/plugin-system/plugin.class';
import StoreApiClient from 'src/service/store-api-client.service';
import { createApp, onMounted, watch } from 'vue';
import { useGlobalCars, useGlobalFit } from './utils/store';
import DomAccess from 'src/helper/dom-access.helper';

export default class MMProductFitPluginLoader extends Plugin {
  init() {
    this.client = new StoreApiClient();

    try {
      this.registerProducts();

      this._runApp();
    } catch (e) {
      console.info('product-fit plugin not activated');
    }
  }

  registerProducts() {
    const fitNodes = DomAccess.querySelectorAll(document, '.product-fit');

    this.products = [...fitNodes].map(el => {
      const options = JSON.parse(el.dataset.productFitOptions);
      return options.productId;
    });
  }

  _registerEvents() {
    document.$emitter.subscribe('carSelected', e => {
      const car = e.detail;

      processCarData(car);
      carDialogShown.value = false;
    });
  }

  _runApp() {
    const _ = this;

    const App = {
      setup() {
        const { value: garage } = useGlobalCars();
        const fitState = useGlobalFit();

        function loadProductFitsCar(kType) {
          fitState.value = [];

          return new Promise((resolve, reject) => {
            const data = JSON.stringify({
              kType,
              productIds: _.products,
            });

            _.client.post(`/store-api/vehicle/product/getProductHint`, data, res => {
              try {
                const response = JSON.parse(res);

                if (response.errors) {
                  reject(new Error(`${response.errors[0].status} ${response.errors[0].title}`));
                }

                fitState.value = response;
                resolve();
              } catch (error) {
                fitState.value = [];

                reject(error);
              }
            });
          });
        }

        onMounted(async () => {
          loadProductFitsCar(garage.active);

          watch(
            () => garage.active,
            newValue => loadProductFitsCar(newValue)
          );

          document.$emitter.subscribe('Listing/afterRenderResponse', () => {
            _.registerProducts();
            loadProductFitsCar(garage.active);
          });
        });
      },
    };

    this._app = createApp(App);
    this._app.mount(this.el);
  }
}
