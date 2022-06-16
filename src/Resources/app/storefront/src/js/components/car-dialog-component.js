import { onMounted, watch } from 'vue';
import { useGlobalCars } from '../utils/store';

export default {
  name: 'app-car',
  emits: ['car-dialog:close'],
  template: `
    <div class="car-search-panel" @click.self="$emit('car-dialog:close')">
      <div class="container">
        <div class="car-search-box">
          <svg class="crw-icon crw-icon--sm car-search__clear" @click="$emit('car-dialog:close')">
            <use xlink:href="#icon_close"></use>
          </svg>

          <div class="car-search-app car-search-app--dialog" data-car-search="true" data-car-search-options='{"mode":"full", "forceShow": true}'></div>
        </div>
      </div>
    </div>
  `,
  setup(props, { emit }) {
    const { value: cars } = useGlobalCars();

    watch(
      () => cars.active,
      () => emit('car-dialog:close')
    );

    onMounted(() => window.PluginManager.initializePlugins());
  },
};
