package com.sensei.bingelingo.ai

import android.content.Context
import android.net.Uri
import android.util.Log
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.Conversation
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.SamplerConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

enum class EngineState {
    UNINITIALIZED,
    IMPORTING,
    INITIALIZING,
    READY,
    ERROR
}

/**
 * LiteRTLMEngine
 *
 * Manages Real On-Device Gemma 3 / LiteRT-LM Model via Google AI Edge `litertlm-android:0.16.1`.
 * - Zero fake replies: all inference runs through native `com.google.ai.edge.litertlm.Engine`.
 * - Tries `Backend.GPU()` first and falls back to `Backend.CPU()` automatically if GPU init fails.
 */
class LiteRTLMEngine(private val context: Context) {

    val assetLoader = AssetLoader(context)

    private val _engineState = MutableStateFlow(EngineState.UNINITIALIZED)
    val engineState: StateFlow<EngineState> = _engineState.asStateFlow()

    private var engine: Engine? = null
    private var conversation: Conversation? = null

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val initMutex = Mutex()
    private val inferenceMutex = Mutex()

    private var isGpuActive = true
    private var activeBackendLabel = "GPU (OpenCL / Vulkan)"
    private var importProgressPercent = 0
    private var lastError: String? = null

    init {
        if (assetLoader.hasValidModel()) {
            initializeAsync()
        }
    }

    fun isReady(): Boolean = _engineState.value == EngineState.READY && engine != null && conversation != null
    fun isInitializing(): Boolean = _engineState.value == EngineState.INITIALIZING
    fun isImporting(): Boolean = _engineState.value == EngineState.IMPORTING
    fun isCurrentlyImporting(): Boolean = isImporting()
    fun getImportProgress(): Int = importProgressPercent
    fun getLastError(): String? = lastError
    fun isGpu(): Boolean = isGpuActive
    fun getBackendLabel(): String = activeBackendLabel
    fun hasValidModel(): Boolean = assetLoader.hasValidModel()
    fun hasValidPrivateModel(): Boolean = hasValidModel()
    fun getModelSizeBytes(): Long = assetLoader.getModelSizeBytes()
    fun getModelPath(): String = assetLoader.getModelPath()

    fun initializeAsync(onComplete: ((Boolean, String?) -> Unit)? = null) {
        scope.launch {
            val success = initialize(useGpu = true)
            withContext(Dispatchers.Main) {
                onComplete?.invoke(success, lastError)
            }
        }
    }

    suspend fun initialize(useGpu: Boolean = true): Boolean = initMutex.withLock {
        withContext(Dispatchers.IO) {
            try {
                if (_engineState.value == EngineState.READY && engine != null && conversation != null) {
                    return@withContext true
                }

                _engineState.value = EngineState.INITIALIZING
                lastError = null

                if (!assetLoader.hasValidModel()) {
                    _engineState.value = EngineState.UNINITIALIZED
                    lastError = "MODEL_NOT_LOADED: .litertlm model dosyası henüz seçilmedi veya indirilmedi."
                    return@withContext false
                }

                val modelFile = assetLoader.getActiveModelFile()
                if (!modelFile.exists() || !modelFile.canRead()) {
                    _engineState.value = EngineState.ERROR
                    lastError = "MODEL_UNREADABLE: Model dosyası okunamıyor: ${modelFile.absolutePath}"
                    return@withContext false
                }

                closeInternal()

                // Try GPU first (if requested), fall back cleanly to CPU if device GPU driver rejects model
                var initializedEngine: Engine? = null
                if (useGpu) {
                    try {
                        val gpuConfig = EngineConfig(
                            modelPath = modelFile.absolutePath,
                            backend = Backend.GPU()
                        )
                        val gpuEngine = Engine(gpuConfig)
                        gpuEngine.initialize()
                        initializedEngine = gpuEngine
                        isGpuActive = true
                        activeBackendLabel = "GPU (OpenCL / Vulkan)"
                    } catch (gpuErr: Throwable) {
                        Log.w("SenseiLiteRT", "GPU backend init failed, falling back to CPU: ${gpuErr.message}")
                        initializedEngine = null
                    }
                }

                if (initializedEngine == null) {
                    val cpuConfig = EngineConfig(
                        modelPath = modelFile.absolutePath,
                        backend = Backend.CPU()
                    )
                    val cpuEngine = Engine(cpuConfig)
                    cpuEngine.initialize()
                    initializedEngine = cpuEngine
                    isGpuActive = false
                    activeBackendLabel = "CPU (On-Device Neural Engine)"
                }

                engine = initializedEngine

                val conversationConfig = ConversationConfig(
                    samplerConfig = SamplerConfig(
                        topK = 40,
                        topP = 0.95,
                        temperature = 0.7
                    )
                )
                conversation = initializedEngine.createConversation(conversationConfig)

                _engineState.value = EngineState.READY
                true
            } catch (e: Throwable) {
                e.printStackTrace()
                closeInternal()
                _engineState.value = EngineState.ERROR
                lastError = "ENGINE_INIT_FAILED: ${e.localizedMessage ?: e.javaClass.simpleName}"
                false
            }
        }
    }

    fun importModelFromUri(
        uri: Uri,
        onProgress: (percent: Int, copiedBytes: Long, totalBytes: Long) -> Unit,
        onComplete: (success: Boolean, message: String) -> Unit
    ) {
        if (_engineState.value == EngineState.IMPORTING) {
            onComplete(false, "Model aktarımı zaten devam ediyor.")
            return
        }

        _engineState.value = EngineState.IMPORTING
        importProgressPercent = 0
        lastError = null

        scope.launch(Dispatchers.IO) {
            try {
                val file = assetLoader.loadModelFromUri(uri) { percent, copied, total ->
                    importProgressPercent = percent
                    onProgress(percent, copied, total)
                }

                if (!file.exists() || file.length() < AssetLoader.MIN_MODEL_SIZE_BYTES) {
                    throw IllegalStateException("Aktarılan model dosyası doğrulanamadı.")
                }

                val initSuccess = initialize(useGpu = true)

                withContext(Dispatchers.Main) {
                    if (initSuccess) {
                        onComplete(true, "Gemma 3 (${file.length() / (1024 * 1024)} MB) yüklendi ve $activeBackendLabel üzerinde hazır!")
                    } else {
                        onComplete(false, "Dosya alındı fakat motor başlatılamadı: $lastError")
                    }
                }
            } catch (e: Exception) {
                _engineState.value = EngineState.ERROR
                lastError = e.localizedMessage
                withContext(Dispatchers.Main) {
                    onComplete(false, "Model aktarım hatası: ${e.localizedMessage}")
                }
            }
        }
    }

    fun downloadModelFromUrl(
        url: String,
        onProgress: (percent: Int, downloadedBytes: Long, totalBytes: Long) -> Unit,
        onComplete: (success: Boolean, message: String) -> Unit
    ) {
        if (_engineState.value == EngineState.IMPORTING) {
            onComplete(false, "Model indirme işlemi zaten devam ediyor.")
            return
        }

        _engineState.value = EngineState.IMPORTING
        importProgressPercent = 0
        lastError = null

        scope.launch(Dispatchers.IO) {
            try {
                val file = assetLoader.downloadModelFromUrl(url) { percent, dl, total ->
                    importProgressPercent = percent
                    onProgress(percent, dl, total)
                }

                val initSuccess = initialize(useGpu = true)

                withContext(Dispatchers.Main) {
                    if (initSuccess) {
                        onComplete(true, "Açık kaynak Gemma 3 (${file.length() / (1024 * 1024)} MB) indirildi ve $activeBackendLabel ile başlatıldı!")
                    } else {
                        onComplete(false, "Model indirildi fakat motor başlatılamadı: $lastError")
                    }
                }
            } catch (e: Exception) {
                _engineState.value = EngineState.ERROR
                lastError = e.localizedMessage ?: "Bilinmeyen indirme hatası"
                withContext(Dispatchers.Main) {
                    onComplete(false, "Model indirme hatası: $lastError")
                }
            }
        }
    }

    fun generateStream(
        prompt: String,
        onToken: (String) -> Unit,
        onComplete: (String) -> Unit,
        onError: (String) -> Unit
    ) {
        scope.launch {
            inferenceMutex.withLock {
                try {
                    if (!isReady()) {
                        if (assetLoader.hasValidModel() && _engineState.value != EngineState.INITIALIZING) {
                            val initOk = initialize(useGpu = true)
                            if (!initOk || !isReady()) {
                                withContext(Dispatchers.Main) {
                                    onError("MODEL_NOT_READY: LiteRT-LM motoru hazır değil ($lastError).")
                                }
                                return@launch
                            }
                        } else {
                            withContext(Dispatchers.Main) {
                                onError("MODEL_NOT_LOADED: Önce telefondaki .litertlm dosyasını seçin veya indirin (Durum: ${_engineState.value}).")
                            }
                            return@launch
                        }
                    }

                    val activeConv = conversation
                    if (activeConv == null) {
                        withContext(Dispatchers.Main) {
                            onError("CONVERSATION_NULL: Aktif LiteRT-LM Conversation oturumu bulunamadı.")
                        }
                        return@launch
                    }

                    val fullResponse = StringBuilder()
                    val contents = Contents.of(prompt)

                    activeConv.sendMessageAsync(contents).collect { message ->
                        val chunkText = message.contents.contents
                            .filterIsInstance<Content.Text>()
                            .joinToString("") { it.text }
                            .ifEmpty { message.toString() }

                        if (chunkText.isNotEmpty()) {
                            fullResponse.append(chunkText)
                            withContext(Dispatchers.Main) {
                                onToken(chunkText)
                            }
                        }
                    }

                    val finalOutput = fullResponse.toString()
                    withContext(Dispatchers.Main) {
                        onComplete(finalOutput)
                    }
                } catch (e: Throwable) {
                    withContext(Dispatchers.Main) {
                        onError("INFERENCE_FAILED: ${e.localizedMessage ?: e.javaClass.simpleName}")
                    }
                }
            }
        }
    }

    fun stopGeneration() {
        try {
            conversation?.cancelProcess()
        } catch (_: Exception) {
        }
    }

    fun deleteModel(): Boolean {
        close()
        return assetLoader.clearPersistedModel()
    }

    fun close() {
        closeInternal()
    }

    private fun closeInternal() {
        try {
            conversation?.close()
            engine?.close()
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            conversation = null
            engine = null
            _engineState.value = EngineState.UNINITIALIZED
        }
    }
}
