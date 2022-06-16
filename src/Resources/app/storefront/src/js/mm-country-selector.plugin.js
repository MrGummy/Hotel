import Plugin from 'src/plugin-system/plugin.class';
import { createApp, reactive, ref, toRefs, computed, onMounted } from 'vue';
import StoreApiClient from 'src/service/store-api-client.service';
import { onClickOutside, onKeyStroke, useMediaQuery, useElementBounding, useWindowSize } from '@vueuse/core';
import { useGlobalCountries } from './utils/store';
import PageLoadingIndicatorUtil from 'src/utility/loading-indicator/page-loading-indicator.util';

export default class MMCountrySelectorPlugin extends Plugin {
  static options = {
    country: null,
  };

  init() {
    this.client = new StoreApiClient();

    this._runApp();
  }

  _runApp() {
    const _ = this;

    const App = {
      template: `
        <div class="country-selector__handler" @click="toggleDropdown">
          <svg class="crw-icon crw-icon--sm"><use xlink:href="#icon_marker"></use></svg><span>{{ country.translated.name }}</span>
        </div>

        <div class="country-selector__dropdown" v-if="dropdownShown" ref="dropdownNode">
          <div v-for="el in countries" class="country-selector__element" @click="setCountry(el)">
            {{ el.translated.name }}
          </div>
        </div>
      `,
      setup() {
        const { country } = _.options;

        const dropdownShown = ref(false);
        const dropdownNode = ref(null);
        const countries = ref([]);

        onClickOutside(dropdownNode, () => toggleDropdown());

        function toggleDropdown() {
          dropdownShown.value = !dropdownShown.value;
        }

        function getCountries() {
          const data = JSON.stringify({});

          return new Promise((resolve, reject) => {
            _.client.post(`/store-api/country`, data, res => {
              try {
                const response = JSON.parse(res);

                if (response.errors) {
                  reject(new Error(`${response.errors[0].status} ${response.errors[0].title}`));
                }

                countries.value = response.elements;

                resolve();
              } catch (error) {
                reject(error);
              }
            });
          });
        }

        function setCountry(country) {
          PageLoadingIndicatorUtil.create();

          const data = JSON.stringify({
            countryId: country.id,
          });

          return new Promise((resolve, reject) => {
            _.client.patch(`/store-api/context`, data, res => {
              try {
                const response = JSON.parse(res);

                if (response.errors) {
                  reject(new Error(`${response.errors[0].status} ${response.errors[0].title}`));
                }

                resolve(location.reload());
              } catch (error) {
                reject(error);
              } finally {
              }
            });
          });
        }

        onMounted(() => getCountries());

        return {
          country,
          countries,
          dropdownShown,
          dropdownNode,
          toggleDropdown,
          setCountry,
        };
      },
    };

    this._app = createApp(App);
    this._app.mount(this.el);
  }
}
