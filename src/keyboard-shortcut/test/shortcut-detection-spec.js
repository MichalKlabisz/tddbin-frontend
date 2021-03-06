import assert from '../../_test-helper/assert';
import Shortcut from '../shortcut';
import ShortcutProcessor from '../shortcut-processor';
import {browserEventUtil} from '../browser-event-util';
import {KeyPressEmulation} from './util';

const noop = function() {};

// - register handler when possible shortcut started

describe('a shortcut', function() {

  var processor;
  var shortcutKeys = ['Meta', 'S'];
  var shortcut = new Shortcut(shortcutKeys, noop);
  var keyPressEmulation;
  var blurCallbacks;
  beforeEach(function() {
    // move this out into util.js
    blurCallbacks = [];
    this.sinon.stub(browserEventUtil, 'onWindowBlur', function(fn) {
      blurCallbacks.push(fn);
    });

    keyPressEmulation = new KeyPressEmulation(this.sinon);

    processor = new ShortcutProcessor();
    processor.registerShortcut(shortcut);
  });

  describe('onKeyDown() should', function() {
    describe('fire', function() {
      it('started by pressing first key: fire the registered callback', function() {
        var callback = this.sinon.spy();
        processor.onKeyDown(callback);
        keyPressEmulation.keyDownByKeyName(shortcutKeys[0]);
        assert.called(callback);
      });

      it('started by pressing first key: fire the registered callback with right param', function() {
        var callback = this.sinon.spy();
        processor.onKeyDown(callback);
        keyPressEmulation.keyDownByKeyName(shortcutKeys[0]);
        assert.calledWith(callback, [shortcutKeys[0]]);
      });

      it('complete shortcut pressed: the callback shall be called the number of keys in the shortcut', function() {
        var callback = this.sinon.spy();
        processor.onKeyDown(callback);
        keyPressEmulation.pressByKeyNames(shortcutKeys);
        assert.callCount(callback, shortcutKeys.length);
      });
    });

    describe('NOT fire', function() {
      it('when unregistered first key of a shortcut was pressed', function() {
        var callback = this.sinon.spy();
        processor.onKeyDown(callback);
        keyPressEmulation.pressByKeyNames(['Alt']);
        assert.notCalled(callback);
      });
    });
  });

  describe('fire onShortcutEnd() callback', function() {

    it('when the shortcut is done', function() {
      var callback = this.sinon.spy();
      processor.onShortcutEnd(callback);
      keyPressEmulation.pressByKeyNames(shortcutKeys);
      assert.called(callback);
    });

    it('also when shortcut + some other key was pressed (an unregistered shortcut)', function() {
      // e.g. Meta+S is a valid shortcut
      // but  Meta+S+S is pressed, it should fire since the shortcut turned invalid
      var callback = this.sinon.spy();
      processor.onShortcutEnd(callback);
      var lastKeyName = shortcutKeys[shortcutKeys.length - 1];
      keyPressEmulation.pressByKeyNames(shortcutKeys.concat(lastKeyName));
      assert.called(callback);
    });

    it('when just first key of shortcut was pressed', function() {
      var callback = this.sinon.spy();
      processor.onShortcutEnd(callback);
      keyPressEmulation.pressByKeyNames([shortcutKeys[0]]);
      assert.called(callback);
    });

    it('when browser window looses focus', function() {
      var callback = this.sinon.spy();
      processor.onShortcutEnd(callback);
      blurCallbacks[0]();
      assert.called(callback);
    });

    describe('DONT fire', function() {
      it('if its just the first key', function() {
        var callback = this.sinon.spy();
        processor.onShortcutEnd(callback);
        keyPressEmulation.keyDownByKeyName(shortcutKeys[0]);
        assert.notCalled(callback);
      });

      it('if a non-registered shortcut is started', function() {
        var callback = this.sinon.spy();
        processor.onShortcutEnd(callback);
        keyPressEmulation.pressByKeyNames(['Alt']);
        assert.notCalled(callback);
      });

      it('for a three-keys shortcut after ONLY the first 2 keys were pressed', function() {
        var manager = new ShortcutProcessor();
        shortcutKeys = ['Meta', 'Shift', 'S'];
        manager.registerShortcut(shortcutKeys, noop);
        var callback = this.sinon.spy();

        manager.onShortcutEnd(callback);
        keyPressEmulation.keyDownByKeyNames(shortcutKeys.slice(0, 2));
        assert.notCalled(callback);
      });
    });

  });
});
