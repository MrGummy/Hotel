import CookiePermissionPlugin from 'src/plugin/cookie/cookie-permission.plugin';

export default class MMCookiePermissionPlugin extends CookiePermissionPlugin {
  /**
   * Shows cookie bar
   */
  _showCookieBar() {
    this.el.style.display = 'flex';

    this.$emitter.publish('showCookieBar');
  }
  /**
   * Calculates cookie bar height
   */
  _calculateCookieBarHeight() {}
  /**
   * Adds cookie bar height as padding-bottom on body
   */
  _setBodyPadding() {
    this.$emitter.publish('setBodyPadding');
  }
  /**
   * Removes padding-bottom from body
   */
  _removeBodyPadding() {
    this.$emitter.publish('removeBodyPadding');
  }
}
