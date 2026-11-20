package com.sensei.bingelingo.translation

import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.sensei.bingelingo.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

/**
 * MLKitTranslateBridge
 * 
 * JavaScript interface bridge connecting Sensei WebView with Google ML Kit Translation organ.
 * Exposed as window.MLKitTranslate and window.SenseiTranslate.
 */
class MLKitTranslateBridge(
    private val activity: MainActivity,
    private val webView: WebView,
    private val manager: MLKitTranslateManager
) {
    private val mainScope = CoroutineScope(Dispatchers.Main)

    @JavascriptInterface
    fun isAvailable(): Boolean = true

    @JavascriptInterface
    fun getLibraryInfo(): String {
        val json = JSONObject()
        json.put("name", "Google ML Kit Translation")
        json.put("artifact", "com.google.mlkit:translate:17.0.3")
        json.put("version", "17.0.3")
        json.put("status", "ready")
        json.put("type", "on-device-native")
        json.put("modelPackageApproxMb", 30)
        json.put("description", "Google ML Kit On-Device Translation. Packs 25-30MB language models locally for zero-quota, 100% offline translations.")
        return json.toString()
    }

    @JavascriptInterface
    fun getAvailableLanguages(): String {
        val array = JSONArray()
        for (lang in MLKitTranslateManager.SUPPORTED_LANGUAGES) {
            val obj = JSONObject()
            obj.put("code", lang.code)
            obj.put("nameTr", lang.nameTr)
            obj.put("nameEn", lang.nameEn)
            obj.put("sizeMb", 30)
            array.put(obj)
        }
        return array.toString()
    }

    @JavascriptInterface
    fun translate(
        text: String,
        sourceLang: String,
        targetLang: String,
        callbackId: String
    ) {
        manager.translate(
            text = text,
            sourceLang = sourceLang,
            targetLang = targetLang,
            requireWifi = false,
            onSuccess = { translatedText ->
                mainScope.launch {
                    val safeText = escapeJs(translatedText)
                    webView.evaluateJavascript(
                        "window.__mlkit_translate_callbacks?.['$callbackId']?.onSuccess('$safeText');",
                        null
                    )
                }
            },
            onError = { errorMsg ->
                mainScope.launch {
                    val safeErr = escapeJs(errorMsg)
                    webView.evaluateJavascript(
                        "window.__mlkit_translate_callbacks?.['$callbackId']?.onError('$safeErr');",
                        null
                    )
                }
            }
        )
    }

    @JavascriptInterface
    fun downloadModel(langCode: String, requireWifi: Boolean, callbackId: String) {
        manager.downloadModel(
            langCode = langCode,
            requireWifi = requireWifi,
            onSuccess = {
                mainScope.launch {
                    webView.evaluateJavascript(
                        "window.__mlkit_translate_callbacks?.['$callbackId']?.onSuccess(true);",
                        null
                    )
                }
            },
            onError = { errorMsg ->
                mainScope.launch {
                    val safeErr = escapeJs(errorMsg)
                    webView.evaluateJavascript(
                        "window.__mlkit_translate_callbacks?.['$callbackId']?.onError('$safeErr');",
                        null
                    )
                }
            }
        )
    }

    @JavascriptInterface
    fun deleteModel(langCode: String, callbackId: String) {
        manager.deleteModel(
            langCode = langCode,
            onSuccess = {
                mainScope.launch {
                    webView.evaluateJavascript(
                        "window.__mlkit_translate_callbacks?.['$callbackId']?.onSuccess(true);",
                        null
                    )
                }
            },
            onError = { errorMsg ->
                mainScope.launch {
                    val safeErr = escapeJs(errorMsg)
                    webView.evaluateJavascript(
                        "window.__mlkit_translate_callbacks?.['$callbackId']?.onError('$safeErr');",
                        null
                    )
                }
            }
        )
    }

    @JavascriptInterface
    fun isModelDownloaded(langCode: String, callbackId: String) {
        manager.isModelDownloaded(langCode) { isDownloaded ->
            mainScope.launch {
                webView.evaluateJavascript(
                    "window.__mlkit_translate_callbacks?.['$callbackId']?.onSuccess($isDownloaded);",
                    null
                )
            }
        }
    }

    @JavascriptInterface
    fun getDownloadedModels(callbackId: String) {
        manager.getDownloadedModels { models ->
            mainScope.launch {
                val array = JSONArray()
                models.forEach { array.put(it) }
                webView.evaluateJavascript(
                    "window.__mlkit_translate_callbacks?.['$callbackId']?.onSuccess(${array.toString()});",
                    null
                )
            }
        }
    }

    private fun escapeJs(input: String): String {
        return input
            .replace("\\", "\\\\")
            .replace("'", "\\'")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t")
    }
}
