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
