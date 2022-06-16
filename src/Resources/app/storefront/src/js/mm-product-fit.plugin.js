import Plugin from 'src/plugin-system/plugin.class';
import { computed, createApp, ref, reactive, watch } from 'vue';
import { useGlobalCars, useGlobalFit } from './utils/store';
import CarDialogComponent from './components/car-dialog-component';

export default class MMProductFitPlugin extends Plugin {
  static options = {
    productId: null,
  };

  init() {
    this._runApp();
  }

  _runApp() {
    const productId = this.options.productId;
    const AppCarDialog = CarDialogComponent;

    const App = {
      template: `
        <div v-if="isLoading" class="loader"></div>

        <a v-else-if="!garage.active" @click="carDialogShown = true" class="btn product-fit__check-button">
            <svg class="crw-icon crw-icon--sm">
                <use xlink:href="#icon_reload"></use>
            </svg>

            <div class="text-box" title="Prüfen Sie, ob es zu Ihrem Fahrzeug passt">
              Prüfen Sie, ob es zu Ihrem Fahrzeug passt
            </div>
        </a>

        <div v-else class="info" :class="fit.className">
            <div class="text-box" :title="fit.text">
              {{ fit.text }}
            </div>

            <svg class="crw-icon crw-icon--sm">
                <use :xlink:href="fit.icon"></use>
            </svg>
        </div>

        <app-car-dialog
          v-if="carDialogShown"
          @car-dialog:close="carDialogShown = false"
        />
      `,
      components: {
        'app-car-dialog': AppCarDialog,
      },
      setup() {
        const { value: garage } = useGlobalCars();
        const fitState = useGlobalFit();

        const carDialogShown = ref(false);
        const isLoading = computed(() => !fitState.value.length);

        const fit = reactive({
          className: null,
          icon: null,
          text: null,
        });

        function setProductFit() {
          if (!fitState.value) {
            fit.className = 'info--danger';
            fit.icon = '#icon_danger';
            fit.text = 'Fehler';

            return;
          }

          const car = fitState.value.find(car => car.productId === productId);

          if (!car) {
            return app.unmount();
          }

          switch (car.status) {
            case 'fit':
              fit.className = 'info--success';
              fit.icon = '#icon_check';
              fit.text = car.details.hint || 'Passt zu Ihrem Fahrzeug';
              break;

            case 'not_fit':
              fit.className = 'info--danger';
              fit.icon = '#icon_danger';
              fit.text = car.details.hint || 'Passt nicht in Ihr Fahrzeug';
              break;

            case 'universal':
              fit.className = 'info--warning';
              fit.icon = '#icon_check';
              fit.text = car.details.hint || 'Es ist ein universelles Produkt';
              break;

            default:
              fit.className = 'info--danger';
              fit.icon = '#icon_danger';
              fit.text = 'Fehler';
          }
        }

        watch(isLoading, newValue => {
          if (!newValue) {
            setProductFit();
          }
        });

        return {
          fit,
          garage,
          isLoading,
          carDialogShown,
        };
      },
    };

    const app = createApp(App);
    app.mount(this.el);
  }
}
