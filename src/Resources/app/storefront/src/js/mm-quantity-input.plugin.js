import Plugin from 'src/plugin-system/plugin.class';
import VueNumberInput from '@chenfengyuan/vue-number-input';
import { createApp, ref, watch, nextTick } from 'vue';

export default class MMQuantityInputPlugin extends Plugin {
  static options = {
    quantity: null,
    min: null,
    max: null,
    step: null,
    name: null,
  };

  init() {
    this._runApp();
  }

  _runApp() {
    const _ = this;

    const App = {
      components: {
        'vue-number-input': VueNumberInput,
      },
      template: `
        <vue-number-input
          center controls
          :min="min"
          :max="max"
          :step="step"
          v-model="qty"
        />
        <input type="hidden" :name="name" :value="qty" />
      `,
      setup() {
        const { productId, min, max, step, name, quantity } = _.options;
        const qty = ref(quantity || min);

        watch(qty, async (nv, ov) => {
          if (nv !== ov) {
            await nextTick();
            _.el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
          }
        });

        return {
          qty,
          productId,
          min,
          max,
          step,
          name,
        };
      },
    };

    this._app = createApp(App);
    this._app.mount(this.el);
  }
}
