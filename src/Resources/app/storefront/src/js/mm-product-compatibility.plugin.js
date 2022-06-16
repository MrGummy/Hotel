import Plugin from 'src/plugin-system/plugin.class';
import StoreApiClient from 'src/service/store-api-client.service';
import { createApp, onMounted, reactive, ref } from 'vue';
import HeightCollapsible from 'vue-height-collapsible/vue3';
import qs from 'qs';

export default class MMProductCompatibilityPlugin extends Plugin {
  static options = {
    productId: null,
    universalProductSnippet: 'Universal product',
  };

  init() {
    this.client = new StoreApiClient();
    this._runApp();
  }

  _runApp() {
    const _ = this;

    const AppModel = {
      props: {
        model: {
          type: Object,
        },
      },
      components: {
        'height-collapsible': HeightCollapsible,
      },
      template: `
        <div class="compatibility__box">
          <div class="compatibility__model" @click="isOpen = !isOpen">
            <slot>{{ model.name }}</slot>

            <svg class="compatibility__chevron" :class="{'compatibility__chevron--open': isOpen }">
              <use xlink:href="#icon_chevron-down"></use>
            </svg>
          </div>

          <height-collapsible :isOpen="isOpen">
            <div class="compatibility__variants">
              <div class="compatibility__variant" v-for="platform in model.platforms">{{ platform.displayName }}</div>
            </div>
          </height-collapsible>
        </div>
      `,
      setup() {
        const isOpen = ref(false);

        return { isOpen };
      },
    };

    const AppBrand = {
      components: {
        'app-model': AppModel,
        'height-collapsible': HeightCollapsible,
      },
      props: {
        brand: {
          type: Object,
        },
      },
      template: `
        <div class="compatibility__box">
          <div class="compatibility__brand" @click="isOpen = !isOpen">
            <slot>{{ brand.name }}</slot>

            <svg class="compatibility__chevron" :class="{'compatibility__chevron--open': isOpen }">
              <use xlink:href="#icon_chevron-down"></use>
            </svg>
          </div>

          <height-collapsible :isOpen="isOpen">
            <div class="compatibility__models">
              <app-model v-for="model in brand.models" :model="model">{{ model.name }}</app-model>
            </div>
          </height-collapsible>
        </div>
      `,
      setup() {
        const isOpen = ref(false);

        return { isOpen };
      },
    };

    const App = {
      components: {
        'app-brand': AppBrand,
      },
      template: `
        <div v-if="isLoading" class="loader"></div>

        <template v-else>
          <div v-if="isUniversal">{{ universalProductSnippet }}</div>

          <table v-else class="compatibility table table-striped product-detail-compatibility-table">
            <tbody>
              <tr class="compatibility-row" v-for="brand in compatibility">
                <td class="compatibility-box">
                  <app-brand :brand="brand">{{ brand.name }}</app-brand>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      `,
      setup() {
        const { productId, universalProductSnippet } = _.options;
        const show = ref(true);

        const isLoading = ref(true);
        const compatibility = ref([]);
        const isUniversal = ref(false);

        async function checkCompatibility() {
          try {
            const { compatibilityType, vehicles } = await loadCompatibility(productId);

            if (compatibilityType === 'universal') {
              isUniversal.value = true;
              return;
            }

            const list = Object.values(vehicles).reduce((acc, curr) => {
              const manufacturer = acc.find(el => el.id === curr.vehicleManufacturer.id);

              const platform = {
                kType: curr.kType,
                name: curr.name.split(' '),
                displayName: curr.displayName,
                vehicleManufacturerId: curr.vehicleManufacturerId,
                vehicleModelId: curr.vehicleModelId,
                engine: curr.engine,
                hsnTsn: curr.hsnTsn,
                productionPeriod: curr.productionPeriod,
                id: curr.id,
              };

              if (!manufacturer) {
                const newManufacturer = {
                  ...curr.vehicleManufacturer,
                  models: [
                    {
                      name: curr.vehicleModel.name,
                      platforms: [platform],
                    },
                  ],
                };

                acc.push(newManufacturer);
              } else {
                const model = manufacturer.models.find(el => el.name === curr.vehicleModel.name);

                if (!model) {
                  const newModel = {
                    name: curr.vehicleModel.name,
                    platforms: [platform],
                  };

                  manufacturer.models.push(newModel);
                } else {
                  model.platforms.push(platform);
                }
              }

              return acc;
            }, []);

            const propComparator = propName => (a, b) =>
              a[propName].localeCompare(b[propName], undefined, { numeric: true, sensitivity: 'base' });

            compatibility.value = list.sort(propComparator('name')).map(brand => {
              brand.models.map(model => {
                model.platforms.sort(propComparator('displayName'));
                return model;
              });

              brand.models.sort(propComparator('name'));

              return brand;
            });
          } catch (error) {
            console.log(error);
          } finally {
            isLoading.value = false;
          }
        }

        function loadCompatibility() {
          return new Promise((resolve, reject) => {
            const query = qs.stringify({ productId });

            _.client.get(`/store-api/vehicle/product/getVehiclesByProductId?${query}`, res => {
              try {
                const response = JSON.parse(res);

                if (response.errors) {
                  reject(new Error(`${response.errors[0].status} ${response.errors[0].title}`));
                }

                resolve(response);
              } catch (error) {
                reject(error);
              }
            });
          });
        }

        checkCompatibility();

        return {
          universalProductSnippet,
          compatibility,
          isLoading,
          isUniversal,
          show,
        };
      },
    };

    this._app = createApp(App);
    this._app.mount(this.el);
  }
}
