package expo.modules.pdascanner

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
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

    val filter = IntentFilter().apply {
      SCAN_ACTIONS.forEach { addAction(it) }
      // QUAN TRỌNG: nhiều máy (vd Urovo ScanWedge) gắn category
      // `android.intent.category.DEFAULT` vào broadcast quét. Theo luật khớp của
      // Android, nếu Intent CÓ category thì IntentFilter phải khai báo category
      // đó mới nhận được — filter chỉ-có-action sẽ BỊ LOẠI. Thêm DEFAULT để khớp
      // cả broadcast có-category (Urovo) lẫn không-category (hãng khác).
      addCategory(Intent.CATEGORY_DEFAULT)
    }

    val scanReceiver = object : BroadcastReceiver() {
      override fun onReceive(ctx: Context, intent: Intent) {
        val data = extractBarcode(intent)
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
            "type" to (extractSymbology(intent) ?: ""),
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
    Log.d(TAG, "Đã đăng ký BroadcastReceiver cho ${SCAN_ACTIONS.size} action")
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
  private fun extractBarcode(intent: Intent): String? {
    for (key in STRING_EXTRA_KEYS) {
      val value = intent.getStringExtra(key)
      if (!value.isNullOrBlank()) return value
    }
    val extras = intent.extras ?: return null
    for (key in STRING_EXTRA_KEYS) {
      when (val raw = extras.get(key)) {
        is CharSequence -> if (raw.isNotBlank()) return raw.toString()
        is ByteArray -> if (raw.isNotEmpty()) return String(raw, Charsets.UTF_8).trim()
      }
    }
    return null
  }

  private fun extractSymbology(intent: Intent): String? {
    for (key in SYMBOLOGY_EXTRA_KEYS) {
      val value = intent.getStringExtra(key)
      if (!value.isNullOrBlank()) return value
    }
    return null
  }

  companion object {
    private const val TAG = "PdaScanner"

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
