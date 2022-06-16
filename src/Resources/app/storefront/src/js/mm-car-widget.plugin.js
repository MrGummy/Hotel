import Plugin from 'src/plugin-system/plugin.class';
import DomAccess from 'src/helper/dom-access.helper';
import StoreApiClient from 'src/service/store-api-client.service';
// import HistoryUtil from 'src/utility/history/history.util';
import { createApp, ref, onMounted, computed, watch } from 'vue';
import { onClickOutside, useUrlSearchParams, useMediaQuery } from '@vueuse/core';
import { useGlobalCars, useGlobalProductCounter } from './utils/store';
import CarDialogComponent from './components/car-dialog-component';
import qs from 'qs';

export default class MMCarWidgetPlugin extends Plugin {
  static options = {
    contextKType: null,
  };

  init() {
    this.client = new StoreApiClient();
    this.listing = null;

    try {
      const listingEl = DomAccess.querySelector(document, '.cms-element-product-listing-wrapper');
      this.listing = window.PluginManager.getPluginInstanceFromElement(listingEl, 'Listing');
    } catch (e) {}

    this._runApp();
  }

  _runApp() {
    const _ = this;

    const AppCarDialog = CarDialogComponent;

    const AppCar = {
      name: 'app-car',
      template: `
        <div class="car-widget__car">
          <div class="car-widget-card" @click="$emit('car:select')">
            <div class="car-widget-card__title">
              <span class="car-widget-card__year">{{ car.productionPeriod }}</span>
              <span class="car-widget-card__name">{{ car.manufacturer }}</span>
              <span class="car-widget-card__name">{{ car.model }}</span>
            </div>
            <div class="car-widget-card__details">{{ car.details }}</div>
          </div>

          <div class="car-widget__car-remove" @click="$emit('car:remove')">
            <svg class="crw-icon crw-icon--sm">
              <use xlink:href="#icon_minus"></use>
            </svg>
          </div>
        </div>
      `,
      emits: ['car:remove', 'car:select'],
      props: {
        car: {
          type: Object,
          default: () => {},
        },
      },
    };

    const AppDropdown = {
      name: 'app-dropdown',
      template: `
        <div class="car-widget__dropdown" ref="dropdown">
          <div class="car-widget__list">
            <app-car
              v-for="car in cars"
              :car="car"
              :key="car.kType"
              @car:remove="$emit('car:remove', car)"
              @car:select="$emit('car:select', car)"
            />
          </div>

          <div class="car-widget__actions">
            <div class="car-widget__action car-widget__action--primary" @click="$emit('car-dialog:open')">+ Fahrzeug hinzufügen</div>
            <div class="car-widget__action" @click="$emit('car:deselect')">Shop ohne Fahrzeug</div>
            <div class="car-widget__action" v-if="false">Fahrzeuge verwalten</div>
          </div>
        </div>
      `,
      emits: ['car:deselect', 'car:remove', 'car:select', 'dropdown:close', 'car-dialog:open'],
      props: { cars: { type: Array, default: () => [] } },
      components: { 'app-car': AppCar },
      setup(props, { emit }) {
        const dropdown = ref(null);

        onClickOutside(dropdown, () => emit('dropdown:close'));

        return { dropdown };
      },
    };

    const App = {
      template: `
        <transition name="car-widget-flash" mode="out-in">
          <div class="car-widget__box" :class="[{'car-widget__box--active': cars.active}]" @click="handleClick" :key="cars.active">
            <svg class="car-widget__icon crw-icon"><use xlink:href="#icon_car"></use></svg>

            <div class="car-widget__info" v-if="!cars.active || isLoading">
              <div class="car-widget__title">Fahrzeug hinzufügen</div>
            </div>

            <div class="car-widget__info" v-else>
              <div class="car-widget__title">{{ activeCar.productionPeriod }} {{ activeCar.manufacturer }} {{ activeCar.model }}</div>
              <div class="car-widget__details">{{ activeCar.details }}</div>
            </div>
          </div>
        </transition>

        <app-dropdown
          :cars="cars.list"
          v-if="dropdownShown"
          @car:deselect="deselectCar"
          @car:select="selectCar"
          @car:remove="removeCar"
          @car-dialog:open="carDialogShown = true"
          @dropdown:close="closeDropdown"
        />

        <app-car-dialog
          v-if="carDialogShown"
          @car-dialog:close="carDialogShown = false"
        />
      `,
      components: {
        'app-dropdown': AppDropdown,
        'app-car-dialog': AppCarDialog,
      },
      setup() {
        const urlParams = useUrlSearchParams('history');
        const isMobileLayout = useMediaQuery('(max-width: 575px)');

        const dropdownShown = ref(false);
        const carDialogShown = ref(false);
        const isLoading = ref(true);

        const { value: cars } = useGlobalCars();
        const { value: counter } = useGlobalProductCounter();

        const activeCar = computed(() => cars.list.find(car => car.kType === cars.active));

        async function selectCar({ kType }) {
          closeDropdown();

          await setCarContext(kType);
          cars.active = kType;

          reloadListing();
          setCarToUrl(kType);
        }

        async function deselectCar() {
          closeDropdown();

          await setCarContext();
          cars.active = null;

          reloadListing();
          setCarToUrl();
        }

        async function removeCar({ kType }) {
          if (cars.active === kType) {
            await setCarContext();
            cars.active = null;

            reloadListing();
            setCarToUrl();
          }

          cars.list = cars.list.filter(car => car.kType !== kType);

          if (isMobileLayout && !cars.list.length) {
            closeDropdown();
          }
        }

        function reloadListing() {
          _.listing ? _.listing.changeListing() : null;
        }

        function closeDropdown() {
          dropdownShown.value = false;
        }

        function handleClick() {
          if (cars.list.length) {
            dropdownShown.value = !dropdownShown.value;
          } else {
            carDialogShown.value = true;
          }
        }

        function getCarByKType(kType) {
          return new Promise((resolve, reject) => {
            const query = qs.stringify({ kType });

            _.client.get(`/store-api/vehicle/filter/getVehicleByKType?${query}`, res => {
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

        function setCarContext(kType = null) {
          cars.loading = true;

          return new Promise((resolve, reject) => {
            const data = JSON.stringify({
              key: 'kType',
              value: kType,
            });

            _.client.post(`/store-api/vehicle/filter/setToSession`, data, res => {
              try {
                const response = JSON.parse(res);

                if (response.errors) {
                  reject(new Error(`${response.errors[0].status} ${response.errors[0].title}`));
                }

                resolve(response);
              } catch (error) {
                reject(error);
              } finally {
                cars.loading = false;
              }
            });
          });
        }

        // listener
        document.$emitter.subscribe('carSelected', e => {
          const car = e.detail;

          processCarData(car);
          carDialogShown.value = false;
        });

        function processCarData(car) {
          const carData = {
            manufacturer: car.vehicleManufacturer.name.trim(),
            model: car.vehicleModel.displayName.replace('--', '').trim(),
            productionPeriod: car.productionPeriod,
            details: `${car.name}, ${car.engine}`,
            kType: car.kType,
            id: car.id,
          };

          if (!cars.list.find(car => car.kType === carData.kType)) {
            cars.list = [...cars.list, carData];
          }

          selectCar({ kType: carData.kType });
        }

        function setCarToUrl(kType) {
          urlParams.kType = kType;
        }

        watch(
          () => cars.active,
          newValue => document.$emitter.publish('CarChanged', newValue)
        );

        onMounted(async () => {
          if (urlParams.kType) {
            if (cars.list && !cars.list.some(car => car.kType === urlParams.kType)) {
              const car = await getCarByKType(urlParams.kType);

              if (car) {
                processCarData(car);
              }
            } else {
              cars.active = urlParams.kType;
            }
          } else if (cars.active) {
            if (_.contextKType !== cars.active) {
              await setCarContext(cars.active);
              _.contextKType = cars.active;
            }

            setCarToUrl(cars.active);
          }

          isLoading.value = false;
        });

        return {
          deselectCar,
          selectCar,
          removeCar,
          handleClick,
          cars,
          activeCar,
          dropdownShown,
          closeDropdown,
          carDialogShown,
          isLoading,
        };
      },
    };

    this._app = createApp(App);
    this._app.mount(this.el);
  }
}
