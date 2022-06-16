import Plugin from 'src/plugin-system/plugin.class';
import StoreApiClient from 'src/service/store-api-client.service';

import { createApp, ref, onMounted, computed, watch } from 'vue';
import { useGlobalCars, useGlobalProductCounter } from './utils/store';

class NavStoreApiClient extends StoreApiClient {
  _createPreparedRequest(type, url, contentType) {
    this._request = new XMLHttpRequest();

    if (url === this._generateUrl) {
      this._request.open(type, url);
    } else {
      this._request.open(type, this._proxyUrl + '?path=' + encodeURIComponent(url));
    }
    this._request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    this._request.setRequestHeader('sw-include-seo-urls', true);

    if (contentType) {
      this._request.setRequestHeader('Content-type', contentType);
    }

    return this._request;
  }
}

export default class MMCarCatalogPlugin extends Plugin {
  static options = {
    visibleItemsLimit: 0,
    showOnCarSelected: false,
    rootId: null,
    salesChannelId: null,
    snippets: {
      moreLink: 'Zeige alles',
      foundedParts: 'Gefunden %NUMBER% Ersatzteile und Zubehör für Ihr Auto',
    },
  };

  async init() {
    this.client = new NavStoreApiClient();

    this._runApp();
  }

  _runApp() {
    const _ = this;

    const AppSkeleton = {
      template: `
        <span class="car-catalog__skeleton"></span>
      `,
    };

    const AppItem = {
      props: {
        storedCounter: Object,
        item: Object,
      },
      template: `
        <div class="car-catalog__list-item">
          <a :href="item.link" class="car-catalog__link">
            <span>{{ item.name }}</span>

            <span v-if="count !== null">{{ count }}</span>
            <app-skeleton v-else />
          </a>
        </div>
      `,
      components: {
        AppSkeleton,
      },
      setup(props) {
        const { value: cars } = useGlobalCars();

        const count = computed(() => {
          if (cars.loading || props.storedCounter.loading) {
            return null;
          }

          const stored = props.storedCounter
            ? props.storedCounter.list.find(el => el.categoryId === props.item.id)
            : null;

          if (stored) {
            return +stored.productCount;
          } else {
            return '';
          }
        });

        return { count };
      },
    };

    const AppCategory = {
      props: {
        storedCounter: Object,
        category: Object,
      },
      template: `
        <div class="car-catalog__category">
          <div class="car-catalog__category-header">
            <a :href="category.link" class="car-catalog__name">
              <span>{{ category.name }}</span>

              <span v-if="count !== null">{{ count }}</span>
              <app-skeleton v-else />
            </a>
          </div>

          <app-item
            :item="child"
            :storedCounter="storedCounter"
            v-for="(child, i) in children"
          />

          <div class="car-catalog__list-item" v-if="limitReached">
            <a :href="category.link" class="car-catalog__more">
              <span>{{ moreLink }}</span>

              <svg class="crw-icon">
                <use xlink:href="#icon_arrow-right-thin"></use>
              </svg>
            </a>
          </div>
        </div>`,
      components: {
        AppSkeleton,
        AppItem,
      },
      setup(props) {
        const visibleItemsLimit = _.options.visibleItemsLimit;
        const moreLink = _.options.snippets.moreLink;
        const { value: cars } = useGlobalCars();

        const children = ref([]);
        const limitReached = ref(false);

        const count = computed(() => {
          if (cars.loading || props.storedCounter.loading) {
            return null;
          }

          const stored = props.storedCounter
            ? props.storedCounter.list.find(el => el.categoryId === props.category.id)
            : null;

          if (stored) {
            return +stored.productCount;
          } else {
            return '';
          }
        });

        onMounted(() => {
          if (!props.category.children) {
            return;
          }

          if (visibleItemsLimit === 0 || props.category.children.length <= visibleItemsLimit) {
            children.value = props.category.children;

            return;
          }

          limitReached.value = true;
          children.value = props.category.children.slice(0, visibleItemsLimit);
        });

        return { count, children, limitReached, moreLink };
      },
    };

    const App = {
      template: `
        <div v-if="activeCar || !showOnCarSelected">
          <div class="car-catalog__title">
            <strong>Teilekatalog</strong>
            <span v-if="activeCar">{{ activeCar.productionPeriod }} {{ activeCar.manufacturer }} {{ activeCar.model }}</span>
          </div>

          <div class="car-catalog__subtitle" v-if="activeCar">
            <span>{{ foundedParts[0] }}</span>

            <strong v-if="founded !== null">{{ founded }}</strong>
            <app-skeleton v-else/>

            <span>{{ foundedParts[1] }}</span>
          </div>

          <div class="car-catalog__categories" v-if="categories.length">
            <app-category v-for="category in categories" :category="category" :storedCounter="storedCounter" />
          </div>
          <div className="car-catalog__loader" v-else>
            <div class="loader"></div>
          </div>
        </div>
      `,
      components: {
        AppCategory,
        AppSkeleton,
      },
      setup() {
        const showOnCarSelected = _.options.showOnCarSelected;

        const { value: cars } = useGlobalCars();
        const { value: storedCounter } = useGlobalProductCounter();

        const foundedParts = _.options.snippets.foundedParts.split('%NUMBER%');
        const founded = computed(() => {
          return categories.value.reduce((agg, curr) => {
            const stored = storedCounter.list.find(el => el.categoryId === curr.id);

            if (stored) {
              agg = agg + +stored.productCount;
            }

            return agg;
          }, null);
        });

        const categories = ref([]);
        const activeCar = computed(() => cars.list.find(car => car.kType === cars.active));

        watch(
          () => cars.active,
          car => {
            if (car) processMenu();
          }
        );

        function loadMenu() {
          const data = JSON.stringify({
            depth: 4,
            buildTree: true,
          });

          return new Promise(resolve => {
            _.client.post(`/store-api/navigation/${_.options.rootId}/${_.options.rootId}`, data, response => {
              resolve(JSON.parse(response));
            });
          });
        }

        async function processMenu() {
          const rawMenu = await loadMenu();

          function parseUrl(el) {
            if (!el.seoUrls) {
              return null;
            }

            const urlHandler = el.seoUrls.find(url => url.salesChannelId === _.options.salesChannelId);

            if (!urlHandler) {
              return null;
            }

            return `/${urlHandler.seoPathInfo ? urlHandler.seoPathInfo : urlHandler.pathInfo}`;
          }

          function processMenuItem(acc, curr) {
            if (!curr.active) {
              return acc;
            }

            const menuItem = {
              id: curr.id,
              name: curr.translated.name,
              link: parseUrl(curr),
            };

            if (curr.childCount) {
              menuItem.children = curr.children.reduce(processMenuItem, []);
            }

            acc = [...acc, menuItem];

            return acc;
          }

          categories.value = rawMenu.reduce(processMenuItem, []);
        }

        onMounted(() => processMenu());

        return {
          activeCar,
          categories,
          showOnCarSelected,
          founded,
          foundedParts,
          storedCounter,
        };
      },
    };

    this._app = createApp(App);
    this._app.mount(this.el);
  }
}
