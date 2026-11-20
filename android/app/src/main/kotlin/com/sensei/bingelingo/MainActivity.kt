package com.sensei.bingelingo

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.webkit.ConsoleMessage
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebChromeClient.FileChooserParams
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.sensei.bingelingo.ai.LiteRTLMBridge
import com.sensei.bingelingo.ai.LiteRTLMEngine
import com.sensei.bingelingo.audio.NativeTTSBridge
import com.sensei.bingelingo.auth.NativeAuthBridge
import com.sensei.bingelingo.translation.MLKitTranslateBridge
import com.sensei.bingelingo.translation.MLKitTranslateManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.IOException
import java.io.InputStream

/**
 * MainActivity
 *
 * Host activity providing Android WebView with HTTPS asset interception (for ES modules),
 * real Google AI Edge LiteRT-LM on-device inference, Storage Access Framework (SAF),
 * Native Google Sign-In, Native TextToSpeech, and Google ML Kit Translation.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    lateinit var litertEngine: LiteRTLMEngine
        private set
    private lateinit var litertBridge: LiteRTLMBridge
    private lateinit var authBridge: NativeAuthBridge
    private lateinit var ttsBridge: NativeTTSBridge
    lateinit var mlkitTranslateManager: MLKitTranslateManager
        private set
    private lateinit var mlkitTranslateBridge: MLKitTranslateBridge

    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null

    private val modelPickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK && result.data != null) {
            val dataIntent = result.data!!
            val uri: Uri? = dataIntent.data ?: dataIntent.clipData?.let { clip ->
                if (clip.itemCount > 0) clip.getItemAt(0).uri else null
            }

            if (uri != null) {
                val takeFlags = dataIntent.flags
                litertEngine.assetLoader.persistUriPermission(uri, takeFlags)
                litertBridge.handleModelFileSelected(uri)
            } else {
                litertBridge.notifyModelSelectionCancelled()
            }
        } else {
            litertBridge.notifyModelSelectionCancelled()
        }
    }

    private val htmlFilePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK && result.data != null) {
            val dataIntent = result.data!!
            val uri: Uri? = dataIntent.data ?: dataIntent.clipData?.let { clip ->
                if (clip.itemCount > 0) clip.getItemAt(0).uri else null
            }

            if (uri != null) {
                fileUploadCallback?.onReceiveValue(arrayOf(uri))
                litertEngine.assetLoader.persistUriPermission(uri, dataIntent.flags)
                litertBridge.handleModelFileSelected(uri)
            } else {
                fileUploadCallback?.onReceiveValue(null)
            }
        } else {
            fileUploadCallback?.onReceiveValue(null)
        }
        fileUploadCallback = null
    }

    fun launchModelPicker() {
        runOnUiThread {
            try {
                val intent = litertEngine.assetLoader.createOpenDocumentIntent()
                modelPickerLauncher.launch(intent)
            } catch (e: Exception) {
                try {
                    val getContentIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = "*/*"
                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    }
                    val chooser = Intent.createChooser(getContentIntent, "Gemma 3 Modelini Seç (.litertlm)")
                    modelPickerLauncher.launch(chooser)
                } catch (e2: Exception) {
                    litertBridge.notifyImportComplete(false, "Dosya seçici açılamadı: ${e2.localizedMessage}")
                }
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        requestRuntimePermissions()

        webView = findViewById(R.id.webView)

        litertEngine = LiteRTLMEngine(applicationContext)
        litertBridge = LiteRTLMBridge(this, webView, litertEngine)
        authBridge = NativeAuthBridge(this, webView)
        ttsBridge = NativeTTSBridge(this, webView)
        mlkitTranslateManager = MLKitTranslateManager(applicationContext)
        mlkitTranslateBridge = MLKitTranslateBridge(this, webView, mlkitTranslateManager)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            allowFileAccessFromFileURLs = true
            allowUniversalAccessFromFileURLs = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
            loadsImagesAutomatically = true
            useWideViewPort = true
            loadWithOverviewMode = true
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                if (consoleMessage != null) {
                    android.util.Log.d(
                        "SenseiJS",
                        "[${consoleMessage.messageLevel()}] ${consoleMessage.message()} (${consoleMessage.sourceId()}:${consoleMessage.lineNumber()})"
                    )
                }
                return true
            }

            override fun onPermissionRequest(request: PermissionRequest?) {
                runOnUiThread {
                    request?.grant(request.resources)
                }
            }

            override fun onShowFileChooser(
                view: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback
                try {
                    val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = "*/*"
                    }
                    htmlFilePickerLauncher.launch(intent)
                    return true
                } catch (e: Exception) {
                    fileUploadCallback?.onReceiveValue(null)
                    fileUploadCallback = null
                    return false
                }
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): WebResourceResponse? {
                val url = request?.url ?: return super.shouldInterceptRequest(view, request)
                val resp = handleIntercept(url)
                return resp ?: super.shouldInterceptRequest(view, request)
            }

            @Deprecated("Deprecated in Java")
            override fun shouldInterceptRequest(view: WebView?, url: String?): WebResourceResponse? {
                if (url != null) {
                    val resp = handleIntercept(Uri.parse(url))
                    if (resp != null) return resp
                }
                return super.shouldInterceptRequest(view, url)
            }

            override fun onReceivedError(view: WebView?, errorCode: Int, description: String?, failingUrl: String?) {
                android.util.Log.e("SenseiWebView", "WebView Error ($errorCode): $description on $failingUrl")
            }
        }

        webView.addJavascriptInterface(litertBridge, "LiteRTLM")
        webView.addJavascriptInterface(authBridge, "SenseiAuth")
        webView.addJavascriptInterface(ttsBridge, "SenseiTTS")
        webView.addJavascriptInterface(ttsBridge, "SenseiAudio")
        webView.addJavascriptInterface(mlkitTranslateBridge, "MLKitTranslate")
        webView.addJavascriptInterface(mlkitTranslateBridge, "SenseiTranslate")

        lifecycleScope.launch(Dispatchers.IO) {
            litertEngine.assetLoader.autoPrepareBundledModel { percent, copiedBytes, totalBytes ->
                litertBridge.notifyAutoExtractProgress(percent, copiedBytes, totalBytes)
            }
            if (litertEngine.hasValidModel()) {
                litertEngine.initialize(useGpu = true)
            }
        }

        // Load over virtual HTTPS domain so Vite ES modules work cleanly without file:// CORS blocks
        webView.loadUrl("https://sensei.app/index.html")
    }

    private fun requestRuntimePermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val perms = mutableListOf(Manifest.permission.RECORD_AUDIO)
            if (Build.VERSION.SDK_INT <= 32) {
                perms.add(Manifest.permission.READ_EXTERNAL_STORAGE)
            }
            val missing = perms.filter {
                ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
            }
            if (missing.isNotEmpty()) {
                requestPermissions(missing.toTypedArray(), 101)
            }
        }
    }

    private fun handleIntercept(uri: Uri): WebResourceResponse? {
        val host = uri.host ?: return null
        val isSenseiDomain = host.equals("sensei.app", ignoreCase = true) ||
            host.equals("appassets.androidplatform.net", ignoreCase = true)

        if (!isSenseiDomain) return null

        var path = uri.path ?: "index.html"
        if (path.isEmpty() || path == "/") path = "index.html"
        while (path.startsWith("/")) path = path.substring(1)

        // Try direct path under assets/, then assets/dist/
        val candidates = listOf(path, "dist/$path")
        for (candidate in candidates) {
            try {
                val stream: InputStream = assets.open(candidate)
                val mime = getMimeType(candidate)
                val headers = hashMapOf(
                    "Access-Control-Allow-Origin" to "*",
                    "Cache-Control" to "no-cache"
                )
                return WebResourceResponse(mime, "UTF-8", 200, "OK", headers, stream)
            } catch (_: IOException) {
            }
        }

        // SPA route fallback
        if (!path.contains(".")) {
            val indexCandidates = listOf("index.html", "dist/index.html")
            for (ic in indexCandidates) {
                try {
                    val stream = assets.open(ic)
                    val headers = hashMapOf(
                        "Access-Control-Allow-Origin" to "*",
                        "Cache-Control" to "no-cache"
                    )
                    return WebResourceResponse("text/html", "UTF-8", 200, "OK", headers, stream)
                } catch (_: IOException) {
                }
            }
        }
        return null
    }

    private fun getMimeType(path: String): String {
        val lower = path.lowercase()
        return when {
            lower.endsWith(".html") || lower.endsWith(".htm") -> "text/html"
            lower.endsWith(".js") || lower.endsWith(".mjs") -> "application/javascript"
            lower.endsWith(".css") -> "text/css"
            lower.endsWith(".json") -> "application/json"
            lower.endsWith(".webmanifest") -> "application/manifest+json"
            lower.endsWith(".png") -> "image/png"
            lower.endsWith(".jpg") || lower.endsWith(".jpeg") -> "image/jpeg"
            lower.endsWith(".svg") -> "image/svg+xml"
            lower.endsWith(".ico") -> "image/x-icon"
            lower.endsWith(".webp") -> "image/webp"
            lower.endsWith(".woff2") -> "font/woff2"
            lower.endsWith(".woff") -> "font/woff"
            lower.endsWith(".ttf") -> "font/ttf"
            lower.endsWith(".mp3") -> "audio/mpeg"
            lower.endsWith(".wav") -> "audio/wav"
            lower.endsWith(".ogg") -> "audio/ogg"
            else -> "application/octet-stream"
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        ttsBridge.shutdown()
        litertEngine.close()
        try {
            mlkitTranslateManager.close()
        } catch (_: Exception) {
        }
    }
}
