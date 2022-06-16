import Plugin from 'src/plugin-system/plugin.class';
import { createApp, reactive, ref, toRefs, computed, onMounted } from 'vue';
import Multiselect from '@vueform/multiselect';
import StoreApiClient from 'src/service/store-api-client.service';
import Inputmask from 'inputmask';
import { onClickOutside, onKeyStroke, useMediaQuery, useElementBounding, useWindowSize } from '@vueuse/core';
import { useGlobalCars } from './utils/store';
import qs from 'qs';

export default class MMCarSearchPlugin extends Plugin {
  static options = {
    mode: 'full', // 'full' | 'minimal'
    forceShow: false,
  };

  init() {
    this.client = new StoreApiClient();

    this._runApp();
  }

  _runApp() {
    const _ = this;

    const CarParamsSelect = {
      template: `
          <multiselect
            class="car-param-select"
            v-model="value"
            trackBy="name"
            ref="multiselect"
            :groups="groups"
            :object="object"
            :valueProp="valueProp"
            :searchable="true"
            :canClear="false"
            :canDeselect="false"
            :openDirection="openDirection"
            noOptionsText="Leer"
            noResultsText="Leer"
            :options="options"
            :placeholder="placeholder"
            @close="onClose"
            @open="onOpen"
            @wheel="onWheel"
          >
            <template #singlelabel="{ value }">
              <div class="multiselect-single-label">
                <span>{{ value.name }}</span>
              </div>
            </template>
            <template #option="{ option }">
              <span :title="option.name">{{ option.name }}</span>
            </template>
          </multiselect>`,
      components: {
        Multiselect,
      },
      props: {
        groups: {
          type: Boolean,
          default: false,
        },
        object: {
          type: Boolean,
          default: false,
        },
        placeholder: {
          type: String,
        },
        options: {
          type: Array,
        },
        valueProp: {
          type: String,
          default: 'id',
        },
      },
      setup() {
        const multiselect = ref(null);

        const { height } = useWindowSize();
        const { top, bottom } = useElementBounding(multiselect);

        const openDirection = computed(() => {
          if (top.value > height.value - bottom.value) {
            return 'top';
          } else {
            return 'bottom';
          }
        });

        function onClose() {
          window.removeEventListener('wheel', scrollProxy);
        }

        function onOpen() {
          window.addEventListener('wheel', scrollProxy);
        }

        function onWheel(e) {
          e.preventDefault();
        }

        function scrollProxy(event) {
          const multiselectScrollNode = multiselect.value._.refs.multiselect.querySelector('.multiselect-dropdown');
          const multiselectNode = multiselect.value._.vnode.el;

          if (multiselectNode === event.target || multiselectNode.contains(event.target)) {
            multiselectScrollNode.scrollTop += event.deltaY;
          }
        }

        return {
          onClose,
          onOpen,
          multiselect,
          openDirection,
          onWheel,
        };
      },
    };

    const CarSearchList = {
      template: `
        <div class="car-number__dropdown-box">
          <div class="car-number__dropdown-list">
            <slot name="list" :selectedIndex="selectedIndex" />

            <slot name="notFound" v-if="listLength === 0"></slot>
          </div>
        </div>
      `,
      props: {
        listLength: Number,
      },
      emits: ['selected', 'close'],
      setup(props, { emit }) {
        const selectedIndex = ref(0);

        onKeyStroke(['ArrowDown', 'Tab'], e => {
          e.preventDefault();

          if (selectedIndex.value <= 0) {
            // If index is less than or equal to zero then set it to the last item index
            selectedIndex.value = props.listLength - 1;
          } else if (selectedIndex.value > 0 && selectedIndex.value <= props.listLength - 1) {
            // If index is larger than zero and smaller or equal to last index then decrement
            selectedIndex.value--;
          }
        });

        onKeyStroke(['ArrowUp'], e => {
          e.preventDefault();

          // Check if index is below 0
          // This means that we did not start yet
          if (selectedIndex.value < 0 || selectedIndex.value === props.listLength - 1) {
            // Set the index to the first item
            selectedIndex.value = 0;
          } else if (selectedIndex.value >= 0 && selectedIndex.value < props.listLength - 1) {
            selectedIndex.value++;
          }
        });

        onKeyStroke(['Escape', 'Esc'], e => {
          emit('close');
          e.preventDefault();
        });

        onKeyStroke('Enter', e => {
          emit('selected', selectedIndex.value);
          e.preventDefault();
        });

        return { selectedIndex };
      },
    };

    const CarSearch = {
      template: `
        <div class="car-number" ref="dropdown">
          <input
            v-model="search"
            v-mask
            type="search"
            @focus="openDropdown"
            @masked="masked"
            @reset="reset"
            placeholder="zu2.1-zu2.2"
            class="form-control car-number__input"
            tabindex="0"
            :class="{'car-number__input--active': isDropdownShown }"
          >

          <car-search-list
            v-if="isDropdownShown"
            :listLength="cars.length"
            @selected="selectWithKeyboard"
            @close="closeDropdown">

            <template
              #list="{ selectedIndex }">
              <div
                v-for="(car, i) in cars"
                @click="select(car)"
                class="car-number__dropdown-list-item car-widget-card"
                :class="{ 'car-number__dropdown-list-item--focused': i === selectedIndex }"
              >
                <div class="car-widget-card__title car-widget-card__title--small">
                  <span class="car-widget-card__year">{{ car.productionPeriod }}</span>
                  <span class="car-widget-card__name">{{ car.vehicleManufacturer.name }}</span>
                  <span class="car-widget-card__name">{{ car.vehicleModel.displayName }}</span>
                </div>
                <div class="car-widget-card__details">{{ car.name + ' ' + car.engine }}</div>
              </div>
            </template>

            <template #notFound>
              <div class="car-number__dropdown-not-found">
                Nicht Gefunden
              </div>
            </template>
          <car-search-list>
        </div>
      `,
      props: {
        cars: {
          type: Array,
          default: () => [],
        },
        searchDone: {
          type: Boolean,
          default: false,
        },
        modelValue: String,
      },
      components: {
        CarSearchList,
      },
      directives: {
        mask: {
          created(el, binding, vnode) {
            new Inputmask({
              mask: '****-***',
              placeholder: '####-###',
              showMaskOnHover: false,
              onincomplete: () => el.dispatchEvent(new CustomEvent('reset', { bubbles: true })),
              oncleared: () => el.dispatchEvent(new CustomEvent('reset', { bubbles: true })),
              oncomplete: () => el.dispatchEvent(new CustomEvent('masked', { bubbles: true })),
            }).mask(el);
          },
        },
      },
      emits: ['search', 'select', 'reset'],
      setup(props, { emit }) {
        const dropdown = ref(null);
        const dropdownOpened = ref(false);

        onClickOutside(dropdown, () => closeDropdown());

        const search = computed({
          get() {
            return props.modelValue;
          },
          set(value) {
            emit('update:modelValue', value);
          },
        });

        function reset() {
          emit('reset');
          openDropdown();
        }

        function masked(e) {
          emit('search', e.target.value);
          openDropdown();
        }

        function select(car) {
          emit('select', car);
        }

        function selectWithKeyboard(i) {
          if (props.cars[i]) {
            select(props.cars[i]);
          }
        }

        function openDropdown() {
          dropdownOpened.value = true;
        }

        function closeDropdown() {
          dropdownOpened.value = false;
        }

        const isDropdownShown = computed(() => props.cars.length !== 1 && dropdownOpened.value && props.searchDone);

        return {
          search,
          masked,
          select,
          openDropdown,
          closeDropdown,
          reset,
          dropdown,
          isDropdownShown,
          dropdownOpened,
          selectWithKeyboard,
        };
      },
    };

    const App = {
      template: `
          <div v-if="isAvailable" class="car-search-box" :class="mode.class">
            <template v-if="mode.value === 'full'">
              <div class="car-search__title">Beginnen Sie mit der Auswahl eines Autos</div>
              <div class="car-search__comment">Mit der Autoauswahl können Sie nur die Teile anzeigen, die zu Ihrem Auto passen</div>
            </template>

            <div class="car-search__tabs" v-if="isMobileLayout">
              <div class="car-search__tab" :class="{'car-search__tab--active': activeTab === 'select'}" @click="activeTab = 'select'">Fahrzeug</div>
              <div class="car-search__tab" :class="{'car-search__tab--active': activeTab === 'search'}" @click="activeTab = 'search'">Schlüsselnummer</div>
            </div>

            <div class="car-selector" v-if="!isMobileLayout || (activeTab === 'select')">
              <div class="car-selector__box">
                <car-params-select
                  v-model="manufacturer"
                  :options="manufacturers"
                  placeholder="Automarke"
                  class="car-selector__brand"
                  @select="selectManufacturer"
                />
              </div>

              <div class="car-selector__box">
                <car-params-select
                  v-model="model"
                  :options="models"
                  groups
                  object
                  :valueProp="'ids'"
                  placeholder="Model"
                  class="car-selector__model"
                  @select="selectModel"
                  :disabled="!manufacturer"
                />
              </div>

              <div class="car-selector__box">
                <car-params-select
                  v-model="year"
                  placeholder="Jahr"
                  class="car-selector__year"
                  :disabled="!model"
                  :options="years"
                  @select="selectYear"
                />
              </div>

              <transition name="sliding">
                <div class="car-selector__box" v-if="isBodyVisible">
                  <car-params-select
                    v-model="body"
                    placeholder="Karosserietyp"
                    class="car-selector__body"
                  />
                </div>
              </transition>

              <transition name="sliding">
                <div class="car-selector__box" v-if="isEngineVisible">
                  <car-params-select
                    groups
                    object
                    :valueProp="'vehicle'"
                    :options="engines"
                    placeholder="Motor"
                    class="car-selector__engine"
                    @select="selectEngine"
                  />
                </div>
              </transition>

              <template v-if="mode.value === 'minimal'">
                <div class="car-search__title car-search__title--number">Oder</div>

                <div class="car-selector__box">
                  <car-search
                    :cars="search.cars"
                    :searchDone="search.searchDone"
                    v-model="search.value"
                    @select="selectCar"
                    @search="searchCar"
                    @reset="searchReset"
                  />
                </div>
              </template>
            </div>

            <template v-if="(mode.value === 'full' && !isMobileLayout) || activeTab === 'search'">
              <div class="car-search__title car-search__title--number">Oder nach Schlüsselnummer</div>
              <car-search
                :cars="search.cars"
                :searchDone="search.searchDone"
                v-model="search.value"
                @select="selectCar"
                @search="searchCar"
                @reset="searchReset"
              />
            </template>
            <div class="car-search__overlay" v-if="isLoading">
              <div class="loader"></div>
            </div>
          </template>
        `,
      components: {
        CarParamsSelect,
        CarSearch,
      },
      setup() {
        const activeTab = ref('select');
        const isMobileLayout = useMediaQuery('(max-width: 575px)');

        const { value: garage } = useGlobalCars();
        const mode = reactive({
          value: _.options.mode,
          class: computed(() => (mode.value === 'minimal' ? 'car-search-box--minimal' : 'car-search-box--full')),
        });

        const isAvailable = computed(() => !garage.active || _.options.forceShow);

        // SELECT
        const car = reactive({
          manufacturer: null,
          year: null,
          model: null,
          // body: null,
          engine: null,
        });

        const carsData = reactive({
          manufacturers: [],
          years: [],
          models: [],
          // bodies: [],
          engines: [],
        });

        const isTouched = computed(() => {
          return Object.values(car).some(v => v);
        });

        const isBodyVisible = computed(() => {
          return false;

          return Object.entries(car)
            .filter(([key, value]) => ['manufacturer', 'year', 'model'].includes(key))
            .every(([key, value]) => value);
        });

        const isEngineVisible = computed(() => {
          return Object.entries(car)
            .filter(([key, value]) => ['manufacturer', 'year', 'model'].includes(key))
            .every(([key, value]) => value);
        });

        function clear() {
          car.manufacturer = null;
          car.year = null;
          car.model = null;
          // car.body = null;
          car.engine = null;
        }

        const isLoading = ref(false);

        function processRawModels(models) {
          const groups = models.reduce((acc, curr) => {
            const label = curr.name.split(' ')[0];

            const group = acc.find(g => g.label === label);

            if (group) {
              const option = group.options.find(o => o.name === curr.name);

              if (option) {
                option.ids = [...option.ids, curr.id];
              } else {
                const newOption = {
                  name: curr.name,
                  ids: [curr.id],
                };

                group.options = [...group.options, newOption];
              }
            } else {
              const newGroup = {
                label: label,
                options: [
                  {
                    name: curr.name,
                    ids: [curr.id],
                  },
                ],
              };

              acc = [...acc, newGroup];
            }

            return acc;
          }, []);

          return groups;
        }

        function processRawEngines(engines) {
          const groups = engines
            .reduce((acc, curr) => {
              const label = curr.vehicle.vehicleModel.platform || '--';

              const group = acc.find(g => g.label === label);

              if (group) {
                const newOption = {
                  name: curr.engine,
                  vehicle: curr.vehicle,
                };

                group.options = [...group.options, newOption];
              } else {
                const newGroup = {
                  label: label,
                  options: [
                    {
                      name: curr.engine,
                      vehicle: curr.vehicle,
                    },
                  ],
                };

                acc = [...acc, newGroup];
              }

              return acc;
            }, [])
            .map(group => {
              if (group.options.length) {
                group.options.sort((a, b) => a.name.localeCompare(b.name));
              }

              return group;
            });

          return groups;
        }

        async function selectManufacturer(value) {
          car.manufacturer = value;

          // reset fields & values
          carsData.models = null;
          carsData.years = null;
          carsData.engines = null;

          car.model = null;
          car.year = null;

          const rawModels = await getModels();
          carsData.models = processRawModels(rawModels);
        }

        async function selectModel(value) {
          car.model = value;

          carsData.years = null;
          carsData.engines = null;

          car.year = null;

          carsData.years = await getYears();
        }

        async function selectYear(value) {
          car.year = value;

          carsData.engines = null;

          const rawEngines = await getVehicleEngines();
          if (rawEngines.length === 1) {
            return selectEngine(rawEngines[0]);
          }

          carsData.engines = processRawEngines(rawEngines);
        }

        function selectEngine(value) {
          selectCar(value.vehicle);

          carsData.models = null;
          carsData.years = null;
          carsData.engines = null;

          car.manufacturer = null;
          car.model = null;
          car.year = null;
        }

        function getManufacturers() {
          return new Promise((resolve, reject) => {
            const query = qs.stringify({
              offset: 0,
              orderBy: 'name',
            });

            _.client.get(`/store-api/vehicle/filter/getVehicleManufacturers?${query}`, res => {
              try {
                const response = Object.values(JSON.parse(res));

                if (response.errors) {
                  reject(new Error(`${response.errors[0].status} ${response.errors[0].title}`));
                }

                carsData.manufacturers = response;
                resolve();
              } catch (error) {
                reject(error);
              }
            });
          });
        }

        async function getYears() {
          return new Promise((resolve, reject) => {
            const data = JSON.stringify({
              vehicleModelIds: car.model.ids,
            });

            _.client.post(`/store-api/vehicle/filter/getVehicleYears`, data, res => {
              try {
                const response = Object.values(JSON.parse(res));

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

        function getModels() {
          return new Promise((resolve, reject) => {
            const query = qs.stringify({
              offset: 0,
              orderBy: 'name',
              vehicleManufacturerId: car.manufacturer,
              year: car.year,
            });

            _.client.get(`/store-api/vehicle/filter/getVehicleModels?${query}`, res => {
              try {
                const response = Object.values(JSON.parse(res));

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

        function getVehicleEngines() {
          return new Promise((resolve, reject) => {
            const data = JSON.stringify({
              year: car.year,
              vehicleModelIds: car.model.ids,
            });

            _.client.post(`/store-api/vehicle/filter/getVehicleEngines?`, data, res => {
              try {
                const response = Object.values(JSON.parse(res));

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

        // SEARCH

        const search = reactive({
          cars: [],
          value: '',
          searchDone: false,
          clear: () => {
            search.cars = [];
            search.value = '';
            search.searchDone = false;
          },
        });

        async function searchCar(code) {
          const cars = await getCarsByCode(code);
          search.searchDone = true;

          if (cars.length === 1) {
            return selectCar(cars[0]);
          }

          search.cars = cars;
        }

        async function getCarsByCode(code) {
          const getVehicleByHsnTsn = code => {
            return new Promise((resolve, reject) => {
              const query = qs.stringify({
                hsnTsn: code,
              });

              _.client.get(`/store-api/vehicle/filter/getVehicleByHsnTsn?${query}`, res => {
                try {
                  const response = JSON.parse(res);

                  if (response.errors) {
                    reject();
                  }

                  resolve(Object.values(response));
                } catch (error) {
                  reject();
                }
              });
            });
          };

          try {
            return await getVehicleByHsnTsn(code);
          } catch (error) {
            return [];
          }
        }

        function searchReset() {
          search.searchDone = false;
          search.cars = [];
        }

        function selectCar(car) {
          isLoading.value = true;
          search.clear();

          setTimeout(() => {
            document.$emitter.publish('carSelected', car);
            isLoading.value = false;
          }, 500);
        }

        function toggleLoading() {
          isLoading.value = !isLoading.value;
        }

        onMounted(() => getManufacturers());

        return {
          ...toRefs(car),
          ...toRefs(carsData),
          selectManufacturer,
          selectYear,
          selectModel,
          selectEngine,
          mode,
          isAvailable,
          isLoading,
          isTouched,
          isBodyVisible,
          isEngineVisible,
          clear,
          selectCar,
          searchReset,
          searchCar,
          search,
          isMobileLayout,
          activeTab,
        };
      },
    };

    this._app = createApp(App);
    this._app.mount(this.el);
  }
}
