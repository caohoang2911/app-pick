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
  AndroidConfig,
  createRunOncePlugin,
} = require('@expo/config-plugins');

const pkg = { name: 'with-stringee-voip', version: '1.0.0' };

const BACKGROUND_MODES = ['voip', 'audio'];

// Quyền Android cho cuộc gọi nền/kill mà @config-plugins/react-native-callkeep
// KHÔNG thêm (nó chỉ thêm FOREGROUND_SERVICE/BIND_TELECOM/READ_PHONE_*/
// CALL_PHONE/RECORD_AUDIO). Danh sách còn lại theo tài liệu push Stringee RN.
// Bỏ qua SYSTEM_ALERT_WINDOW: luồng này dùng CallKeep (ConnectionService +
// full-screen intent) chứ không vẽ overlay đè app khác, nên không cần — thêm vào
// còn bị Play Store soi kỹ. Chỉ cần nếu chuyển sang UI overlay tự vẽ.
const ANDROID_CALL_PERMISSIONS = [
  'android.permission.POST_NOTIFICATIONS', // Android 13+: hiển thị thông báo
  'android.permission.USE_FULL_SCREEN_INTENT', // màn gọi full-screen khi khoá máy
  'android.permission.FOREGROUND_SERVICE_PHONE_CALL', // API 34: VoiceConnectionService foregroundServiceType=phoneCall
  'android.permission.DISABLE_KEYGUARD',
  'android.permission.WAKE_LOCK', // đánh thức CPU khi push cuộc gọi tới lúc màn tắt
  'android.permission.VIBRATE', // rung khi đổ chuông
];

const IMPORT_ANCHOR = '#import "AppDelegate.h"';
// Dùng import dạng framework (app bật use_frameworks! :static + use_modular_headers!).
const IMPORTS = [
  '#import <PushKit/PushKit.h>',
  '#import <RNVoipPushNotification/RNVoipPushNotificationManager.h>',
  '#import <RNCallKeep/RNCallKeep.h>',
  '#import <RNStringee/RNStringeeInstanceManager.h>',
].join('\n');

// Khai báo AppDelegate tuân thủ PKPushRegistryDelegate (bắt buộc để
// `voipRegistry.delegate = self` hợp lệ — nếu thiếu sẽ lỗi compile
// "assigning to 'id<PKPushRegistryDelegate>' from incompatible type 'AppDelegate *'").
const DELEGATE_DECL = `
@interface AppDelegate () <PKPushRegistryDelegate>
@end
`;

const REGISTRY_INIT = `
  // @stringee-voip: DẤU VÂN TAY BUILD — in version + build number lúc launch để
  // biết bản đang cài có phải mới nhất không (đối chiếu với \`eas build:list\`).
  // Tag "callkeep-native-setup" = bản này ĐÃ có fix CallKit setup ở native.
  NSLog(@"[StringeeVoIP] APP LAUNCH — v%@ (build %@) | callkeep-native-setup",
        [NSBundle mainBundle].infoDictionary[@"CFBundleShortVersionString"],
        [NSBundle mainBundle].infoDictionary[@"CFBundleVersion"]);

  // @stringee-voip: setup CallKeep NGAY ở native để CXProvider (sharedProvider)
  // luôn sẵn sàng — kể cả khi app bị kill, VoIP push report CallKit TRƯỚC khi JS
  // kịp chạy setupCallKeep(). Thiếu bước này thì reportNewIncomingCall gửi tới
  // sharedProvider = nil ⇒ không hiện màn gọi. JS setup sau sẽ thành no-op
  // (isSetupNatively) nhưng vẫn đăng ký listener bình thường.
  [RNCallKeep setup:@{
    @"appName": @"App Pick",
    @"supportsVideo": @NO,
    @"maximumCallGroups": @"1",
    @"maximumCallsPerCallGroup": @"1",
    @"handleType": @[@"generic", @"number"]
  }];

  // @stringee-voip: khởi tạo PushKit registry để nhận VoIP push
  PKPushRegistry *voipRegistry = [[PKPushRegistry alloc] initWithQueue:dispatch_get_main_queue()];
  voipRegistry.delegate = self;
  voipRegistry.desiredPushTypes = [NSSet setWithObject:PKPushTypeVoIP];
`;

const PUSHKIT_METHODS = `
#pragma mark - Stringee VoIP push (PushKit) — @stringee-voip
- (void)pushRegistry:(PKPushRegistry *)registry didUpdatePushCredentials:(PKPushCredentials *)credentials forType:(PKPushType)type {
  NSLog(@"[StringeeVoIP] didUpdatePushCredentials: VoIP token length=%lu", (unsigned long)credentials.token.length);
  [RNVoipPushNotificationManager didUpdatePushCredentials:credentials forType:(NSString *)type];
}

- (void)pushRegistry:(PKPushRegistry *)registry didInvalidatePushTokenForType:(PKPushType)type {
}

- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(PKPushType)type withCompletionHandler:(void (^)(void))completion {
  // ⚠️ Cấu trúc payload VoIP của Stringee có thể lồng nhiều tầng — xác nhận bằng
  // cách log payload.dictionaryPayload trên máy thật. Các fallback giữ an toàn.
  NSDictionary *dict = payload.dictionaryPayload;
  NSLog(@"[StringeeVoIP] didReceiveIncomingPush — FULL payload=%@", dict);
  NSDictionary *data = dict[@"data"][@"map"][@"data"][@"map"];
  if (![data isKindOfClass:[NSDictionary class]]) data = dict[@"data"];
  if (![data isKindOfClass:[NSDictionary class]]) data = dict;

  NSString *callId = data[@"callId"] ? [NSString stringWithFormat:@"%@", data[@"callId"]] : @"";
  NSNumber *serial = [data[@"serial"] isKindOfClass:[NSNumber class]] ? data[@"serial"] : @(1);

  // ⚠️ FIX (root cause không popup): Stringee để 'from' là DICT lồng {map:{alias,number}},
  // KHÔNG có key 'fromAlias' ở tầng data. Trước đây gán thẳng data[@"from"] (NSDictionary)
  // vào handle/callerName (khai báo NSString*) → CXHandle.value/localizedCallerName là
  // NSDictionary → CXCallUpdate KHÔNG hợp lệ → callservicesd drop report IM LẶNG → completion
  // không chạy, không popup. Phải trích ra NSString.
  id fromObj = data[@"from"];
  NSDictionary *fromMap = [fromObj isKindOfClass:[NSDictionary class]] ? fromObj[@"map"] : nil;
  NSString *fromAlias = [fromMap[@"alias"] isKindOfClass:[NSString class]] ? fromMap[@"alias"] : nil;
  NSString *fromNumber = fromMap[@"number"] ? [NSString stringWithFormat:@"%@", fromMap[@"number"]] : nil;
  if (!fromAlias && [data[@"fromAlias"] isKindOfClass:[NSString class]]) fromAlias = data[@"fromAlias"];
  if (!fromNumber && [fromObj isKindOfClass:[NSString class]]) fromNumber = (NSString *)fromObj; // payload phẳng
  NSString *callerName = fromAlias.length ? fromAlias : (fromNumber.length ? fromNumber : @"Tổng đài");
  NSString *handle = fromNumber.length ? fromNumber : @"Stringee";
  NSLog(@"[StringeeVoIP] parsed callId=%@ serial=%@ caller=%@ (%@) handle=%@ (%@)",
        callId, serial, callerName, [callerName class], handle, [handle class]);

  // Dùng ĐÚNG uuid mà JS call.generateUUID() sẽ trả về (cùng singleton cache theo
  // callId-serial) để khi answer, registry tra cứu được StringeeCall2 tương ứng.
  NSString *uuid = callId.length > 0
      ? [RNStringeeInstanceManager.instance generateUUID:callId serial:serial]
      : [[NSUUID UUID] UUIDString]; // fallback: iOS 13+ BẮT BUỘC luôn report 1 call

  [RNVoipPushNotificationManager didReceiveIncomingPushWithPayload:payload forType:(NSString *)type];

  NSLog(@"[StringeeVoIP] reportNewIncomingCall uuid=%@", uuid);
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

    // 1.5) khai báo conformance PKPushRegistryDelegate qua class extension
    // (chèn ngay trước @implementation AppDelegate).
    if (!contents.includes('PKPushRegistryDelegate')) {
      contents = contents.replace(
        /(@implementation AppDelegate\b)/,
        `${DELEGATE_DECL}\n$1`,
      );
    }

    // 2) khởi tạo registry trong didFinishLaunchingWithOptions
    if (!contents.includes('desiredPushTypes')) {
      contents = contents.replace(
        /(\n\s*return \[super application:application didFinishLaunchingWithOptions:launchOptions\];)/,
        `\n${REGISTRY_INIT}$1`,
      );
    }

    // 3) chèn các method PushKit trước @end cuối cùng.
    // ⚠️ Guard phải dùng marker RIÊNG của khối method — KHÔNG dùng '@stringee-voip'
    // vì bước (2) REGISTRY_INIT đã chèn marker đó rồi ⇒ sẽ skip nhầm, mất method
    // didReceiveIncomingPush ⇒ iOS không report CallKit ⇒ background/killed không đổ chuông.
    if (!contents.includes('didReceiveIncomingPushWithPayload')) {
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

function withCallAndroidPermissions(config) {
  return AndroidConfig.Permissions.withPermissions(
    config,
    ANDROID_CALL_PERMISSIONS,
  );
}

const withStringeeVoip = (config) => {
  config = withVoipBackgroundModes(config);
  config = withPushKitAppDelegate(config);
  config = withCallAndroidPermissions(config);
  return config;
};

module.exports = createRunOncePlugin(withStringeeVoip, pkg.name, pkg.version);
