import { Linking } from 'react-native';
import type { StoreApi, UseBoundStore } from 'zustand';

export function openLinkInBrowser(url: string) {
  Linking.canOpenURL(url).then((canOpen) => canOpen && Linking.openURL(url));
}

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never;

export const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  _store: S
) => {
  let store = _store as WithSelectors<typeof _store>;
  store.use = {};
  for (let k of Object.keys(store.getState())) {
    (store.use as any)[k] = () => store((s) => s[k as keyof typeof s]);
  }

  return store;
};

export const INJECTED_SCRIPT = `
(function () {
  if (window.SeedcomBrowser) return;
  if (!window.JSON) return;
  const genEventId = function () {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 10; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  window.SeedcomBrowser = {
    sendEvent: function (event, data) {
      const event_type = event + '-' + genEventId();
      let post_event_data = event_type;

      if (data) {
        switch (typeof data) {
          case 'object':
            post_event_data += '.' + JSON.stringify(data);
            break;
          case 'string':
            post_event_data += '.' + data;
            break;
          default:
            return reject(new Error('Invalid data type'));
        }
      }
      window.ReactNativeWebView.postMessage(post_event_data);
    },
    handleSDK: function (event, data) {
      return new Promise(function (resolve, reject) {
        const event_type = event + '-' + genEventId();

        function resolveHandle(event_message) {
          window.removeEventListener(event_message.type, resolveHandle, false);
          const event_data = event_message.detail;
          try {
            if (typeof event_data !== 'object') {
              return reject(new Error('Wrong type respone data'));
            }

            if (event_data.type === 'reject') {
              if (!event_data.message) {
                return reject(new Error('Missing message reject'));
              }

              return reject(new Error(event_data.message));
            }

            if (!event_data.payload) {
              return reject(new Error('Missing payload in resolve'));
            }

            if (typeof event_data.payload.object !== 'undefined') {
              return resolve(event_data.payload.object);
            }

            if (typeof event_data.payload.string !== 'undefined') {
              return resolve(event_data.payload.string);
            }

            if (typeof event_data.payload.number !== 'undefined') {
              return resolve(event_data.payload.number);
            }

            if (typeof event_data.payload.boolean !== 'undefined') {
              return resolve(event_data.payload.boolean);
            }

            return resolve(null);
          } catch (e) {
            return reject(e);
          }
        }

        let post_event_data = event_type;

        if (data) {
          switch (typeof data) {
            case 'object':
              post_event_data += '.' + JSON.stringify(data);
              break;
            case 'string':
              post_event_data += '.' + data;
              break;
            default:
              return reject(new Error('Invalid data type'));
          }
        }
        window.addEventListener(event_type, resolveHandle, false);
        window.ReactNativeWebView.postMessage(post_event_data);
      })
    },
    callbackEvent: function (event, data) {
      var customEvent = new CustomEvent(event, { detail: data });
      window.dispatchEvent(customEvent);
    },
    
    // === CONTENT READING METHODS ===
    
    // Đọc HTML content của page hoặc element
    getHTML: function (selector) {
      try {
        if (!selector) {
          return document.documentElement.outerHTML;
        }
        const element = document.querySelector(selector);
        return element ? element.outerHTML : null;
      } catch (e) {
        return null;
      }
    },
    
    // Đọc text content của element
    getText: function (selector) {
      try {
        if (!selector) {
          return document.body.textContent || document.body.innerText;
        }
        const element = document.querySelector(selector);
        return element ? (element.textContent || element.innerText) : null;
      } catch (e) {
        return null;
      }
    },
    
    // Đọc giá trị của input/form fields
    getFieldValue: function (selector) {
      try {
        const element = document.querySelector(selector);
        if (!element) return null;
        
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
          return element.value;
        }
        return element.textContent || element.innerText;
      } catch (e) {
        return null;
      }
    },
    
    // Đọc tất cả form data
    getFormData: function (formSelector) {
      try {
        const form = formSelector ? document.querySelector(formSelector) : document.querySelector('form');
        if (!form) return null;
        
        const formData = {};
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(function(input) {
          if (input.name) {
            if (input.type === 'checkbox' || input.type === 'radio') {
              if (input.checked) {
                formData[input.name] = input.value;
              }
            } else {
              formData[input.name] = input.value;
            }
          }
        });
        
        return formData;
      } catch (e) {
        return null;
      }
    },
    
    // Đọc localStorage
    getLocalStorage: function (key) {
      try {
        if (!key) {
          // Trả về tất cả localStorage
          const storage = {};
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            storage[k] = localStorage.getItem(k);
          }
          return storage;
        }
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    
    // Đọc sessionStorage
    getSessionStorage: function (key) {
      try {
        if (!key) {
          // Trả về tất cả sessionStorage
          const storage = {};
          for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i);
            storage[k] = sessionStorage.getItem(k);
          }
          return storage;
        }
        return sessionStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    
    // Đọc cookies
    getCookies: function () {
      try {
        const cookies = {};
        document.cookie.split(';').forEach(function(cookie) {
          const parts = cookie.trim().split('=');
          if (parts.length === 2) {
            cookies[parts[0]] = decodeURIComponent(parts[1]);
          }
        });
        return cookies;
      } catch (e) {
        return null;
      }
    },
    
    // Query elements và trả về thông tin
    queryElements: function (selector) {
      try {
        const elements = document.querySelectorAll(selector);
        const result = [];
        
        elements.forEach(function(el, index) {
          result.push({
            index: index,
            tagName: el.tagName,
            id: el.id || null,
            className: el.className || null,
            textContent: el.textContent || el.innerText || null,
            value: el.value || null,
            href: el.href || null,
            src: el.src || null
          });
        });
        
        return result;
      } catch (e) {
        return null;
      }
    },
    
    // Đọc page info tổng quát
    getPageInfo: function () {
      try {
        return {
          title: document.title,
          url: window.location.href,
          domain: window.location.hostname,
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
          userAgent: navigator.userAgent,
          referrer: document.referrer || null,
          readyState: document.readyState
        };
      } catch (e) {
        return null;
      }
    },
    
    // Gửi content lên React Native với event type cụ thể
    sendContent: function (contentType, data) {
      this.sendEvent('content', {
        type: contentType,
        data: data,
        timestamp: new Date().getTime()
      });
    }
  };
})();

const meta = document.createElement('meta');
meta.setAttribute('content', 'width=device-width, initial-scale=1, user-scalable=0');
meta.setAttribute('name', 'viewport');
document.getElementsByTagName('head')[0].appendChild(meta);

var style = document.createElement('style');
style.innerHTML = \`
* {
	-webkit-touch-callout: none;
	-webkit-user-select: none;
	-webkit-tap-highlight-color: rgba(0,0,0,0);
	outline: none;
}

input,textarea {
	outline: none;
	-webkit-touch-callout: default !important;
	-webkit-user-select: text !important;
}
\`;
document.head.appendChild(style);

true;
`;

export const parseEventData = (message: string) => {
  const regex_valid_message = /([\w.]+)-([\w]+)\.?(.*)/g;

  const match = regex_valid_message.exec(message);
  if (!match || match.length < 3)
    return {
      event: undefined,
      data: undefined,
      responseId: undefined,
    };

  const event = match[1];
  const random = match[2];
  const data = match[3];
  const responseId = `${event}-${random}`;

  return {
    event,
    data,
    responseId,
  };
};

// === HELPER FUNCTIONS ĐỂ ĐỌC CONTENT TỪ WEBVIEW ===

export interface WebViewRef {
  injectJavaScript: (script: string) => void;
}

export const WebViewContentReader = {
  // === CHỈ GIỮ LẠI CÁC METHOD CẦN THIẾT ===

  // Đọc text của element cụ thể
  getElementText: (webViewRef: WebViewRef, selector: string) => {
    const script = `
      (function() {
        const elementText = window.SeedcomBrowser?.getText?.('${selector}');
        window.SeedcomBrowser?.sendContent?.('elementText', { selector: '${selector}', text: elementText });
        return true;
      })();
    `;
    webViewRef.injectJavaScript(script);
  },
};
