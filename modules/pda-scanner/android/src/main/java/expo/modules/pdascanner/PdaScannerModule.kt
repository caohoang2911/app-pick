package expo.modules.pdascanner

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.SystemClock
import android.util.Log
import androidx.core.os.bundleOf
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * PdaScanner — cầu nối nhận sự kiện quét mã vạch từ đầu đọc laser của máy PDA
 * Android (Urovo / Zebra DataWedge / Honeywell / Chainway / Newland / Unitech /
 * iData...).
 *
 * Cơ chế: hầu hết máy PDA KHÔNG cho truy cập trực tiếp tia laser. Dịch vụ quét
 * của hãng giải mã mã vạch rồi PHÁT một Android Broadcast Intent. Module này
 * đăng ký một BroadcastReceiver ở RUNTIME (không khai báo <receiver> trong
 * AndroidManifest — nên KHÔNG bị `expo prebuild --clean` xoá) cho một loạt
 * action + extra phổ biến của nhiều hãng, rồi bắn event "onScan" xuống JS.
 *
 * Chỉ lắng nghe khi JS có listener (OnStartObserving) và huỷ đăng ký khi hết
 * listener / module bị destroy (OnStopObserving/OnDestroy) để tránh rò rỉ.
 *
 * Muốn hỗ trợ thêm hãng khác: thêm action vào SCAN_ACTIONS và tên extra vào
 * STRING_EXTRA_KEYS (tra tài liệu "Intent output" của hãng đó).
 */
class PdaScannerModule : Module() {

  private var receiver: BroadcastReceiver? = null
  private var lastEmittedData: String? = null
  private var lastEmitTimeMs: Long = 0L

  override fun definition() = ModuleDefinition {
    Name("PdaScanner")

    Events("onScan")

    Function("isAvailable") { true }

    OnStartObserving {
      Log.d(TAG, "OnStartObserving → đăng ký receiver")
      registerScanReceiver()
    }

    OnStopObserving {
      Log.d(TAG, "OnStopObserving → huỷ đăng ký receiver")
      unregisterScanReceiver()
    }

    OnDestroy {
      unregisterScanReceiver()
    }
  }

  private fun registerScanReceiver() {
    if (receiver != null) return
    val context = appContext.reactContext
    if (context == null) {
      Log.w(TAG, "reactContext null — chưa đăng ký được receiver")
      return
    }

    // Urovo ScanWedge cho phép đổi action/category/tên extra ngay trong Settings.
    // Đọc provider exported của hãng để receiver đi theo cấu hình hiện tại thay
    // vì bắt người dùng chỉnh PDA về đúng các giá trị hard-code của App Pick.
    // Nếu không phải máy Urovo (hoặc provider không tồn tại), các mapping tĩnh
    // đa hãng bên dưới vẫn hoạt động như trước.
    ensureUrovoIntentOutput()
    val urovoSettings = readUrovoIntentSettings(context)
    val scanActions = (SCAN_ACTIONS + urovoSettings.actions).distinct()
    val barcodeExtraKeys = (STRING_EXTRA_KEYS + urovoSettings.dataExtraKeys).distinct()
    val symbologyExtraKeys =
      (SYMBOLOGY_EXTRA_KEYS + urovoSettings.symbologyExtraKeys).distinct()

    val filter = IntentFilter().apply {
      scanActions.forEach { addAction(it) }
      // QUAN TRỌNG: nhiều máy (vd Urovo ScanWedge) gắn category
      // `android.intent.category.DEFAULT` vào broadcast quét. Theo luật khớp của
      // Android, nếu Intent CÓ category thì IntentFilter phải khai báo category
      // đó mới nhận được — filter chỉ-có-action sẽ BỊ LOẠI. Thêm DEFAULT để khớp
      // cả broadcast có-category (Urovo) lẫn không-category (hãng khác).
      addCategory(Intent.CATEGORY_DEFAULT)
      urovoSettings.categories.forEach { addCategory(it) }
    }

    val scanReceiver = object : BroadcastReceiver() {
      override fun onReceive(ctx: Context, intent: Intent) {
        val data = extractBarcode(intent, barcodeExtraKeys)
        if (data.isNullOrBlank()) {
          // Nhận được broadcast nhưng không rút ra được mã → dump toàn bộ extra
          // để biết máy này dùng tên key gì mà bổ sung vào STRING_EXTRA_KEYS.
          Log.w(TAG, "Broadcast action=${intent.action} nhưng KHÔNG thấy extra mã vạch quen thuộc — các extra hiện có:")
          intent.extras?.let { extras ->
            for (key in extras.keySet()) Log.w(TAG, "   extra: $key = ${extras.get(key)}")
          }
          return
        }

        // Throttle mã trùng: chế độ "continuous" bắn cùng 1 mã hàng chục lần/giây.
        // Cửa sổ TRƯỢT (cập nhật mốc kể cả khi bỏ qua) → mỗi loạt quét chỉ bắn 1
        // event xuống JS, chặn spam qua bridge + re-render ngay từ native. Mã đó
        // chỉ được nhận lại sau khi ngừng quét > THROTTLE_MS.
        val now = SystemClock.elapsedRealtime()
        if (data == lastEmittedData && now - lastEmitTimeMs < THROTTLE_MS) {
          lastEmitTimeMs = now
          return
        }
        lastEmittedData = data
        lastEmitTimeMs = now

        Log.d(TAG, "onReceive action=${intent.action} → barcode = $data")
        this@PdaScannerModule.sendEvent(
          "onScan",
          bundleOf(
            "data" to data,
            "action" to (intent.action ?: ""),
            "type" to (extractSymbology(intent, symbologyExtraKeys) ?: ""),
          ),
        )
      }
    }

    // Android 13+ (và bắt buộc khi targetSdk >= 34): broadcast đến từ tiến trình
    // khác (dịch vụ quét của hãng) nên phải khai báo RECEIVER_EXPORTED, nếu
    // không hệ thống sẽ ném SecurityException khi registerReceiver.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.registerReceiver(scanReceiver, filter, Context.RECEIVER_EXPORTED)
    } else {
      @Suppress("UnspecifiedRegisterReceiverFlag")
      context.registerReceiver(scanReceiver, filter)
    }
    receiver = scanReceiver
    Log.d(TAG, "Đã đăng ký BroadcastReceiver cho ${scanActions.size} action")
  }

  private fun unregisterScanReceiver() {
    val current = receiver ?: return
    try {
      appContext.reactContext?.unregisterReceiver(current)
    } catch (_: IllegalArgumentException) {
      // đã huỷ đăng ký trước đó — bỏ qua
    }
    receiver = null
  }

  /** Tìm chuỗi mã vạch trong các extra phổ biến; thử String trước, rồi CharSequence/byte[]. */
  private fun extractBarcode(intent: Intent, extraKeys: List<String>): String? {
    val extras = intent.extras ?: return null

    // Đọc trực tiếp từ Bundle thay vì gọi getStringExtra trước: Urovo mặc định
    // còn gửi `barcode` dưới dạng byte[], và một số firmware có thể dùng cùng
    // tên key cho kiểu dữ liệu khác String.
    for (key in extraKeys) {
      when (val raw = extras.get(key)) {
        is CharSequence -> if (raw.isNotBlank()) return raw.toString()
        is ByteArray -> if (raw.isNotEmpty()) return String(raw, Charsets.UTF_8).trim()
      }
    }
    return null
  }

  private fun extractSymbology(intent: Intent, extraKeys: List<String>): String? {
    val extras = intent.extras ?: return null
    for (key in extraKeys) {
      when (val raw = extras.get(key)) {
        is CharSequence -> if (raw.isNotBlank()) return raw.toString()
        is Number -> return raw.toString()
      }
    }
    return null
  }

  /**
   * Urovo mặc định có thể xuất scan như bàn phím. Khi App Pick bắt đầu nghe,
   * chuyển sang Intent output bằng SDK chính thức của hãng để người dùng không
   * phải vào ScanWedge chỉnh tay trên từng máy. Dùng reflection để project vẫn
   * compile/chạy trên PDA hãng khác mà không cần đóng gói vendor SDK.
   *
   * Không ép action/extra về một giá trị riêng của App Pick: receiver sẽ đọc và
   * đi theo action/extra hiện tại ở [readUrovoIntentSettings], nên cấu hình cũ
   * đang hoạt động vẫn được giữ nguyên.
   */
  private fun ensureUrovoIntentOutput() {
    try {
      val scanManagerClass = Class.forName(UROVO_SCAN_MANAGER_CLASS)
      val scanManager = scanManagerClass.getDeclaredConstructor().newInstance()
      val outputMode =
        (scanManagerClass.getMethod("getOutputMode").invoke(scanManager) as? Number)?.toInt()

      if (outputMode == UROVO_OUTPUT_MODE_KEYBOARD) {
        val switched =
          scanManagerClass
            .getMethod("switchOutputMode", Integer.TYPE)
            .invoke(scanManager, UROVO_OUTPUT_MODE_INTENT) as? Boolean
        Log.d(TAG, "Urovo output mode keyboard → intent: success=$switched")
      } else {
        Log.d(TAG, "Urovo output mode hiện tại=$outputMode; không cần thay đổi")
      }
    } catch (_: ClassNotFoundException) {
      // Không phải thiết bị Urovo — dùng BroadcastReceiver đa hãng như trước.
    } catch (error: Exception) {
      // Không để lỗi vendor SDK làm hỏng quá trình đăng ký receiver.
      Log.w(TAG, "Không thể áp Intent output qua Urovo ScanManager", error)
    }
  }

  /**
   * Đọc các output field của Urovo ScanWedge qua ContentProvider exported.
   * Đây là thao tác read-only; App Pick không ghi hay reset cấu hình của PDA.
   * Lấy các field ở mọi profile để receiver vẫn khớp khi ScanWedge đổi profile
   * theo package/activity ở foreground.
   */
  private fun readUrovoIntentSettings(context: Context): UrovoIntentSettings {
    val actions = linkedSetOf<String>()
    val categories = linkedSetOf<String>()
    val dataExtraKeys = linkedSetOf<String>()
    val symbologyExtraKeys = linkedSetOf<String>()
    var keyboardEnabled: String? = null
    var intentEnabled: String? = null

    try {
      context.contentResolver.query(
        Uri.parse(UROVO_PROPERTY_SETTINGS_URI),
        arrayOf("name", "value"),
        null,
        null,
        null,
      )?.use { cursor ->
        val nameIndex = cursor.getColumnIndex("name")
        val valueIndex = cursor.getColumnIndex("value")
        if (nameIndex < 0 || valueIndex < 0) return@use

        while (cursor.moveToNext()) {
          val name = cursor.getString(nameIndex) ?: continue
          val value = cursor.getString(valueIndex)?.trim().orEmpty()
          when (name) {
            "WEDGE_INTENT_ACTION_NAME" -> if (value.isNotEmpty()) actions.add(value)
            "WEDGE_INTENT_CATEGORY_NAME" -> if (value.isNotEmpty()) categories.add(value)
            "INTENT_DATA_STRING_TAG", "WEDGE_INTENT_DATA_STRING_TAG" ->
              if (value.isNotEmpty()) dataExtraKeys.add(value)
            "INTENT_DECODE_DATA_TAG", "WEDGE_INTENT_DECODE_DATA_TAG" ->
              if (value.isNotEmpty()) dataExtraKeys.add(value)
            "INTENT_LABEL_TYPE_TAG", "WEDGE_INTENT_LABEL_TYPE_TAG" ->
              if (value.isNotEmpty()) symbologyExtraKeys.add(value)
            "WEDGE_KEYBOARD_ENABLE" -> keyboardEnabled = value
            "WEDGE_INTENT_ENABLE" -> intentEnabled = value
          }
        }
      }

      if (actions.isNotEmpty() || dataExtraKeys.isNotEmpty()) {
        Log.d(
          TAG,
          "Urovo ScanWedge config: intent=$intentEnabled keyboard=$keyboardEnabled " +
            "actions=$actions categories=$categories dataKeys=$dataExtraKeys",
        )
      }
    } catch (error: Exception) {
      // Máy hãng khác không có provider này là bình thường; không làm module fail.
      Log.d(TAG, "Không đọc được Urovo ScanWedge config; dùng mapping mặc định", error)
    }

    return UrovoIntentSettings(
      actions = actions,
      categories = categories,
      dataExtraKeys = dataExtraKeys,
      symbologyExtraKeys = symbologyExtraKeys,
    )
  }

  private data class UrovoIntentSettings(
    val actions: Set<String> = emptySet(),
    val categories: Set<String> = emptySet(),
    val dataExtraKeys: Set<String> = emptySet(),
    val symbologyExtraKeys: Set<String> = emptySet(),
  )

  companion object {
    private const val TAG = "PdaScanner"
    private const val UROVO_SCAN_MANAGER_CLASS = "android.device.ScanManager"
    private const val UROVO_OUTPUT_MODE_INTENT = 0
    private const val UROVO_OUTPUT_MODE_KEYBOARD = 1
    private const val UROVO_PROPERTY_SETTINGS_URI =
      "content://com.ubx.datawedge.provider/property_settings"

    // Bỏ qua cùng 1 mã lặp trong khoảng này (chế độ continuous). Chỉ cần lớn hơn
    // khoảng cách giữa 2 lần decode (~40–150ms) là gom hết 1 loạt về 1 event.
    private const val THROTTLE_MS = 400L

    // Action broadcast do dịch vụ quét của các hãng PDA phổ biến phát ra.
    private val SCAN_ACTIONS = listOf(
      "android.intent.ACTION_DECODE_DATA",              // Urovo (mặc định) + nhiều máy generic
      "com.symbol.datawedge.api.RESULT_ACTION",         // Zebra DataWedge (API result)
      "com.zebra.datawedge.ACTION_RESULT",              // Zebra (biến thể)
      "nlscan.action.SCANNER_RESULT",                   // Newland
      "com.honeywell.decode.action",                    // Honeywell (một số dòng)
      "com.honeywell.decode.intent.action.SCAN_RESULT", // Honeywell (một số dòng)
      "scan.rcv.message",                               // Honeywell (dòng cũ)
      "com.rfid.SCAN",                                  // Chainway
      "com.scanner.broadcast",                          // Chainway / generic
      "android.intent.action.SCANRESULT",               // iData
      "unitech.scanservice.data",                       // Unitech
      "com.android.server.scannerservice.broadcast",    // generic
      "com.barcode.sendBroadcast",                      // generic
    )

    // Key extra chứa chuỗi mã vạch đã giải mã — thử lần lượt theo thứ tự.
    private val STRING_EXTRA_KEYS = listOf(
      "barcode_string",                     // Urovo, một số Chainway
      "com.ubx.datawedge.data_string",      // Urovo ScanWedge (đã xác minh trên máy thật)
      "com.symbol.datawedge.data_string",   // Zebra DataWedge
      "SCAN_BARCODE1",                      // Newland
      "value",                              // iData, generic
      "data",                               // Honeywell, com.scanner.broadcast
      "barcode",                            // generic
      "EXTRA_BARCODE_DECODING_DATA",        // Honeywell HSM
      "decode_rslt",                        // Honeywell (biến thể)
      "scannerdata",                        // Unitech
      "SCAN_RESULT",                        // generic
      "scanData",
      "scan_data",
    )

    // Key extra chứa loại mã (symbology) nếu máy có gửi kèm.
    private val SYMBOLOGY_EXTRA_KEYS = listOf(
      "symName",                            // Urovo ScanWedge (đã xác minh: UPC-A / EAN-13)
      "com.ubx.datawedge.symbology_name",   // Urovo ScanWedge
      "codetype",                           // Urovo ScanWedge
      "barcode_type",
      "com.symbol.datawedge.label_type",
      "SCAN_BARCODE_TYPE",
      "codeId",
      "typeName",
    )
  }
}
