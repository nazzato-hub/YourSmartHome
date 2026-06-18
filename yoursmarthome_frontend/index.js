
// Polyfill per correggere il bug di React Native 0.81+ (TypeError: Cannot assign to read-only property 'NONE')
if (typeof global !== 'undefined') {
  if (global.Event) {
    try {
      ['NONE', 'CAPTURING_PHASE', 'AT_TARGET', 'BUBBLING_PHASE'].forEach((prop, index) => {
        Object.defineProperty(global.Event, prop, {
          value: index,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      });
    } catch (e) {
      console.warn("Impossibile applicare la patch immediata a global.Event:", e);
    }
  } else {
    let _Event = undefined;
    try {
      Object.defineProperty(global, 'Event', {
        configurable: true,
        enumerable: true,
        get() {
          return _Event;
        },
        set(value) {
          _Event = value;
          if (_Event) {
            try {
              ['NONE', 'CAPTURING_PHASE', 'AT_TARGET', 'BUBBLING_PHASE'].forEach((prop, index) => {
                Object.defineProperty(_Event, prop, {
                  value: index,
                  writable: true,
                  configurable: true,
                  enumerable: true,
                });
              });
            } catch (e) {
              // Silenzioso
            }
          }
        }
      });
    } catch (e) {
      console.warn("Impossibile registrare il setter per global.Event:", e);
    }
  }
}

import registerRootComponent from 'expo/src/launch/registerRootComponent';
import App from './App';

registerRootComponent(App);
