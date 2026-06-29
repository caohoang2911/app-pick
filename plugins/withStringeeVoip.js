/* eslint-disable */
// Config plugin tuỳ biến cho luồng VoIP push (iOS PushKit) của Stringee.
//
// @config-plugins/react-native-callkeep đã lo phần CallKeep (quyền Android +
// ConnectionService, background mode iOS). Plugin này bổ sung phần KHÔNG có
// plugin nào cover: PushKit trong AppDelegate (iOS 13+ bắt buộc report cuộc gọi
// tới CallKit ngay khi nhận VoIP push) + background mode `voip`/`audio`.
//
// ⚠️ App dùng use_frameworks! :static — nếu build lỗi vì header
// "RNCallKeep.h"/"RNVoipPushNotificationManager.h", đổi sang dạng framework
// (<RNCallKeep/RNCallKeep.h>) hoặc thêm modular headers trong Podfile.
const {
  withInfoPlist,
  withAppDelegate,
  createRunOncePlugin,
} = require('@expo/config-plugins');

const pkg = { name: 'with-stringee-voip', version: '1.0.0' };

const BACKGROUND_MODES = ['voip', 'audio'];

const IMPORT_ANCHOR = '#import "AppDelegate.h"';
const IMPORTS = [
  '#import <PushKit/PushKit.h>',
  '#import "RNVoipPushNotificationManager.h"',
  '#import "RNCallKeep.h"',
].join('\n');

const REGISTRY_INIT = `
  // @stringee-voip: khởi tạo PushKit registry để nhận VoIP push
  PKPushRegistry *voipRegistry = [[PKPushRegistry alloc] initWithQueue:dispatch_get_main_queue()];
  voipRegistry.delegate = self;
  voipRegistry.desiredPushTypes = [NSSet setWithObject:PKPushTypeVoIP];
`;

const PUSHKIT_METHODS = `
#pragma mark - Stringee VoIP push (PushKit) — @stringee-voip
- (void)pushRegistry:(PKPushRegistry *)registry didUpdatePushCredentials:(PKPushCredentials *)credentials forType:(PKPushType)type {
  [RNVoipPushNotificationManager didUpdatePushCredentials:credentials forType:(NSString *)type];
}

- (void)pushRegistry:(PKPushRegistry *)registry didInvalidatePushTokenForType:(PKPushType)type {
}

- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(PKPushType)type withCompletionHandler:(void (^)(void))completion {
  NSDictionary *data = payload.dictionaryPayload[@"data"] ?: payload.dictionaryPayload;
  NSString *uuid = [[NSUUID UUID] UUIDString];
  NSString *callerName = data[@"fromAlias"] ?: data[@"from"] ?: @"Tổng đài";
  NSString *handle = data[@"from"] ?: @"unknown";

  [RNVoipPushNotificationManager didReceiveIncomingPushWithPayload:payload forType:(NSString *)type];

  // iOS 13+: BẮT BUỘC report cuộc gọi tới CallKit ngay khi nhận VoIP push.
  [RNCallKeep reportNewIncomingCall:uuid
                             handle:handle
                         handleType:@"generic"
                           hasVideo:NO
                localizedCallerName:callerName
                    supportsHolding:YES
                       supportsDTMF:YES
                   supportsGrouping:YES
                 supportsUngrouping:YES
                        fromPushKit:YES
                            payload:data
              withCompletionHandler:completion];
}
`;

function withVoipBackgroundModes(config) {
  return withInfoPlist(config, (cfg) => {
    const modes = cfg.modResults.UIBackgroundModes || [];
    BACKGROUND_MODES.forEach((m) => {
      if (!modes.includes(m)) modes.push(m);
    });
    cfg.modResults.UIBackgroundModes = modes;
    return cfg;
  });
}

function withPushKitAppDelegate(config) {
  return withAppDelegate(config, (cfg) => {
    const language = cfg.modResults.language;
    if (language !== 'objc' && language !== 'objcpp') {
      throw new Error(
        `[with-stringee-voip] Chỉ hỗ trợ AppDelegate Obj-C/Obj-C++ (đang là ${language}).`,
      );
    }

    let contents = cfg.modResults.contents;

    // 1) imports (idempotent)
    if (!contents.includes('RNVoipPushNotificationManager.h')) {
      contents = contents.replace(
        IMPORT_ANCHOR,
        `${IMPORT_ANCHOR}\n${IMPORTS}`,
      );
    }

    // 2) khởi tạo registry trong didFinishLaunchingWithOptions
    if (!contents.includes('desiredPushTypes')) {
      contents = contents.replace(
        /(\n\s*return \[super application:application didFinishLaunchingWithOptions:launchOptions\];)/,
        `\n${REGISTRY_INIT}$1`,
      );
    }

    // 3) chèn các method PushKit trước @end cuối cùng
    if (!contents.includes('@stringee-voip')) {
      const lastEnd = contents.lastIndexOf('@end');
      if (lastEnd !== -1) {
        contents =
          contents.slice(0, lastEnd) +
          PUSHKIT_METHODS +
          '\n' +
          contents.slice(lastEnd);
      }
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
}

const withStringeeVoip = (config) => {
  config = withVoipBackgroundModes(config);
  config = withPushKitAppDelegate(config);
  return config;
};

module.exports = createRunOncePlugin(withStringeeVoip, pkg.name, pkg.version);
