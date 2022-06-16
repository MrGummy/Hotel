import Plugin from 'src/plugin-system/plugin.class';
import Debouncer from 'src/helper/debouncer.helper';

export default class ScrollUpPlugin extends Plugin {
  static options = {
    /**
     * debounce time for the scroll event
     */
    scrollDebounceTime: 35,

    /**
     * scroll up button visible at position
     */
    visiblePos: 250,
    visibleCls: 'header-bottom__actions--visible',
  };

  init() {
    this._assignDebouncedOnScrollEvent();
    this._registerEvents();
  }

  /**
   * registers all needed events
   *
   * @private
   */
  _registerEvents() {
    document.addEventListener('scroll', this._debouncedOnScroll, false);
  }

  /**
   * debounce is required to ensure the callback gets executed when scrolling ends
   *
   * @return {Function}
   * @private
   */
  _assignDebouncedOnScrollEvent() {
    this._debouncedOnScroll = Debouncer.debounce(this._toggleVisibility.bind(this), this.options.scrollDebounceTime);
  }

  /**
   * toggle visibility scroll-up button
   *
   * @private
   */
  _toggleVisibility() {
    if (window.scrollY > this.options.visiblePos) {
      this.el.classList.add(this.options.visibleCls);
    } else {
      this.el.classList.remove(this.options.visibleCls);
    }

    this.$emitter.publish('toggleVisibility');
  }
}
