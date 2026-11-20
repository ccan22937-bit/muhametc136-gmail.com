package com.sensei.bingelingo.ai

import android.content.Context
import android.util.Log
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.Conversation
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.Message
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
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream

/**
 * AiService (Gemma 3 1B On-Device AI Engine)
 *
 * Compatible with com.google.ai.edge.litertlm:litertlm-android:0.16.1
 */
class AiService private constructor(private val context: Context) {

    companion object {
        private const val TAG = "SenseiAiService"
        const val MODEL_FILENAME = "gemma3-1b-it-int4.litertlm"
        const val ALT_MODEL_FILENAME = "gemma-3-1b-it-gpu.litertlm"

        @Volatile
        private var INSTANCE: AiService? = null

        fun getInstance(context: Context): AiService {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: AiService(context.applicationContext).also { INSTANCE = it }
            }
        }
    }

    enum class State {
        NOT_INITIALIZED,
        PREPARING_MODEL,
        INITIALIZING_ENGINE,
        READY,
        INFERRING,
        ERROR
    }

    private val _state = MutableStateFlow(State.NOT_INITIALIZED)
    val state: StateFlow<State> = _state.asStateFlow()

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val mutex = Mutex()

    private var engine: Engine? = null
    private var conversation: Conversation? = null
    private var isGpuActive = true
    private var lastErrorMessage: String? = null

    suspend fun initialize(forceCpu: Boolean = false): Boolean = withContext(Dispatchers.IO) {
        mutex.withLock {
            if (_state.value == State.READY && engine != null && conversation != null) {
                return@withContext true
            }

            try {
                _state.value = State.PREPARING_MODEL
                val modelFile = getOrExtractModelFile()
                if (modelFile == null || !modelFile.exists() || modelFile.length() < 100_000_000L) {
                    val err = "Gemma 3 model dosyası ($MODEL_FILENAME) bulunamadı veya boyutu geçersiz!"
                    lastErrorMessage = err
                    _state.value = State.ERROR
                    return@withContext false
                }

                _state.value = State.INITIALIZING_ENGINE

                var newEngine: Engine? = null
                if (!forceCpu) {
                    try {
                        val gpuCfg = EngineConfig(modelPath = modelFile.absolutePath, backend = Backend.GPU())
                        val e = Engine(gpuCfg)
                        e.initialize()
                        newEngine = e
                        isGpuActive = true
                    } catch (e: Throwable) {
                        Log.w(TAG, "GPU init failed, using CPU: ${e.message}")
                        newEngine = null
                    }
                }

                if (newEngine == null) {
                    val cpuCfg = EngineConfig(modelPath = modelFile.absolutePath, backend = Backend.CPU())
                    val e = Engine(cpuCfg)
                    e.initialize()
                    newEngine = e
                    isGpuActive = false
                }

                engine = newEngine

                val samplerConfig = SamplerConfig(
                    topK = 40,
                    topP = 0.95,
                    temperature = 0.7
                )

                val systemPrompt = """
                    Sen Sensei uygulamasının profesyonel, sıcak ve akıllı yapay zeka dil koçusun.
                    Kullanıcıyla doğal, akıcı ve bağlama duyarlı bir sohbet gerçekleştir.
                """.trimIndent()

                val conversationConfig = ConversationConfig(
                    systemInstruction = Contents.of(systemPrompt),
                    samplerConfig = samplerConfig
                )

                conversation = newEngine.createConversation(conversationConfig)
                _state.value = State.READY
                return@withContext true
            } catch (e: Throwable) {
                Log.e(TAG, "LiteRT-LM init error", e)
                lastErrorMessage = e.localizedMessage ?: e.message
                _state.value = State.ERROR
                close()
                return@withContext false
            }
        }
    }

    fun sendMessageStream(
        userText: String,
        onToken: (String) -> Unit,
        onComplete: (fullResponse: String) -> Unit,
        onError: (Throwable) -> Unit
    ) {
        scope.launch {
            if (_state.value != State.READY || conversation == null) {
                val initialized = initialize()
                if (!initialized) {
                    withContext(Dispatchers.Main) {
                        onError(IllegalStateException(lastErrorMessage ?: "Gemma 3 motoru hazır değil!"))
                    }
                    return@launch
                }
            }

            _state.value = State.INFERRING
            val accumulated = StringBuilder()

            try {
                val contents = Contents.of(userText)
                conversation?.sendMessageAsync(contents)?.collect { message ->
                    val token = message.contents.contents
                        .filterIsInstance<Content.Text>()
                        .joinToString("") { it.text }
                        .ifEmpty { message.toString() }
                    if (token.isNotEmpty()) {
                        accumulated.append(token)
                        withContext(Dispatchers.Main) {
                            onToken(token)
                        }
                    }
                }

                _state.value = State.READY
                withContext(Dispatchers.Main) {
                    onComplete(accumulated.toString().trim())
                }
            } catch (e: Throwable) {
                _state.value = State.READY
                withContext(Dispatchers.Main) {
                    onError(e)
                }
            }
        }
    }

    private fun getOrExtractModelFile(): File? {
        val modelsDir = File(context.filesDir, "models").apply { mkdirs() }
        val targetInternalFile = File(modelsDir, MODEL_FILENAME)

        if (targetInternalFile.exists() && targetInternalFile.length() > 100_000_000L) {
            return targetInternalFile
        }

        try {
            val assetList = context.assets.list("models") ?: emptyArray()
            if (MODEL_FILENAME in assetList || ALT_MODEL_FILENAME in assetList) {
                val assetName = if (MODEL_FILENAME in assetList) MODEL_FILENAME else ALT_MODEL_FILENAME
                context.assets.open("models/$assetName").use { inputStream ->
                    copyStreamToFile(inputStream, targetInternalFile)
                }
                return targetInternalFile
            }
        } catch (_: Throwable) {
        }

        val downloadPaths = listOf(
            File("/storage/emulated/0/Download", MODEL_FILENAME),
            File("/storage/emulated/0/Download", ALT_MODEL_FILENAME),
            File(context.getExternalFilesDir(null), MODEL_FILENAME)
        )

        for (extFile in downloadPaths) {
            if (extFile.exists() && extFile.length() > 100_000_000L && extFile.canRead()) {
                return extFile
            }
        }

        return null
    }

    private fun copyStreamToFile(inputStream: InputStream, destination: File) {
        val tempFile = File(destination.parentFile, "${destination.name}.tmp")
        FileOutputStream(tempFile).use { output ->
            val buffer = ByteArray(64 * 1024)
            var bytesRead: Int
            while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                output.write(buffer, 0, bytesRead)
            }
            output.flush()
        }
        if (destination.exists()) destination.delete()
        tempFile.renameTo(destination)
    }

    fun isReady(): Boolean = _state.value == State.READY && engine != null
    fun isGpu(): Boolean = isGpuActive
    fun getLastError(): String? = lastErrorMessage

    fun close() {
        try {
            conversation?.close()
            conversation = null
            engine?.close()
            engine = null
        } catch (_: Throwable) {
        } finally {
            _state.value = State.NOT_INITIALIZED
        }
    }
}
