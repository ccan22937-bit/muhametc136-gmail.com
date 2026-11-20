package com.sensei.bingelingo.ai

import android.content.Context
import android.util.Log
import com.google.ai.edge.litertlm.Backend
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
 * Sensei dil öğrenme uygulamasının çevrimdışı, sınırsız ve kotasız
 * sesli/yazılı yapay zeka organı. Google'ın resmi 'com.google.ai.edge.litertlm:litertlm-android'
 * kütüphanesini kullanarak 'gemma3-1b-it-int4.litertlm' modelini doğrudan
 * cihazın grafik işlemcisinde (GPU/NPU) çalıştırır.
 *
 * Özellikler:
 * 1. Model APK içine gömüldüğünde assets/models/ altından otomatik yüklenir.
 * 2. Cihaz hafızasındaki (Downloads / App Storage) model dosyasını da destekler.
 * 3. Donanım hızlandırma (Backend.GPU) kullanır; desteklenmeyen cihazlarda CPU'ya geçer.
 * 4. Token bazlı canlı akış (streaming response) desteği sunar.
 * 5. Uygulama silindiğinde tüm model ve bellek dosyaları telefon hafızasından tertemiz silinir.
 */
class AiService private constructor(private val context: Context) {

    companion object {
        private const val TAG = "SenseiAiService"
        const val MODEL_FILENAME = "gemma3-1b-it-int4.litertlm"
        const val ALT_MODEL_FILENAME = "gemma-3-1b-it-gpu.litertlm"
        const val ASSET_MODEL_PATH = "models/$MODEL_FILENAME"

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

    /**
     * Modeli hazırla ve LiteRT-LM motorunu GPU ile başlat.
     */
    suspend fun initialize(forceCpu: Boolean = false): Boolean = withContext(Dispatchers.IO) {
        mutex.withLock {
            if (_state.value == State.READY && engine != null && conversation != null) {
                return@withContext true
            }

            try {
                _state.value = State.PREPARING_MODEL
                Log.i(TAG, "Gemma 3 model dosyası aranıyor...")

                // 1. Model dosyasını yerel depolamada hazırla
                val modelFile = getOrExtractModelFile()
                if (modelFile == null || !modelFile.exists() || modelFile.length() < 100_000_000L) {
                    val err = "Gemma 3 model dosyası ($MODEL_FILENAME) bulunamadı veya boyutu geçersiz!"
                    Log.e(TAG, err)
                    lastErrorMessage = err
                    _state.value = State.ERROR
                    return@withContext false
                }

                _state.value = State.INITIALIZING_ENGINE
                Log.i(TAG, "LiteRT-LM Engine başlatılıyor (Boyut: ${modelFile.length() / (1024 * 1024)} MB)...")

                // 2. GPU Destekli Engine Konfigürasyonu
                val backendToUse = if (forceCpu) {
                    isGpuActive = false
                    Backend.CPU()
                } else {
                    try {
                        isGpuActive = true
                        Backend.GPU()
                    } catch (e: Throwable) {
                        Log.w(TAG, "GPU başlatılamadı, CPU'ya geçiliyor: ${e.message}")
                        isGpuActive = false
                        Backend.CPU()
                    }
                }

                val engineConfig = EngineConfig(
                    modelPath = modelFile.absolutePath,
                    backend = backendToUse
                )

                val newEngine = Engine(engineConfig)
                newEngine.initialize()
                engine = newEngine

                // 3. Sensei Sohbet Oturumu ve Sampler Yapılandırması
                val samplerConfig = SamplerConfig(
                    temperature = 0.7f,
                    topK = 40,
                    topP = 0.95f
                )

                val systemPrompt = """
                    Sen Sensei uygulamasının profesyonel, sıcak ve akıllı yapay zeka dil koçusun.
                    Kullanıcıyla doğal, akıcı ve bağlama duyarlı bir sohbet gerçekleştir.
                    Kullanıcının dil öğrenme hedefine göre motive et, hatalarını nazikçe düzelt ve sohbeti devam ettir.
                    Asla üçüncü parti model veya şirket isimleri anma; kendini tescilli Sensei AI olarak tanıt.
                """.trimIndent()

                val conversationConfig = ConversationConfig(
                    systemInstruction = Message(
                        role = Message.Role.SYSTEM,
                        content = systemPrompt
                    ),
                    samplerConfig = samplerConfig
                )

                conversation = newEngine.createConversation(conversationConfig)
                _state.value = State.READY
                Log.i(TAG, "Gemma 3 LiteRT-LM başarıyla hazırlandı! (GPU: $isGpuActive)")
                return@withContext true

            } catch (e: Throwable) {
                Log.e(TAG, "LiteRT-LM Motoru başlatılırken hata oluştu", e)
                lastErrorMessage = e.localizedMessage ?: e.message
                _state.value = State.ERROR
                close()
                return@withContext false
            }
        }
    }

    /**
     * Kullanıcı mesajını gönder ve yanıtı token token canlı akış (streaming) olarak al.
     */
    fun sendMessageStream(
        userText: String,
        onToken: (String) -> Unit,
        onComplete: (fullResponse: String) -> Unit,
        onError: (Throwable) -> Unit
    ) {
        scope.launch {
            if (_state.value != State.READY || conversation == null) {
                // Hazır değilse otomatik başlatmayı dene
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
                val userMessage = Message(
                    role = Message.Role.USER,
                    content = userText
                )

                conversation?.sendMessageAsync(userMessage)?.collect { token ->
                    accumulated.append(token)
                    withContext(Dispatchers.Main) {
                        onToken(token)
                    }
                }

                _state.value = State.READY
                withContext(Dispatchers.Main) {
                    onComplete(accumulated.toString().trim())
                }
            } catch (e: Throwable) {
                _state.value = State.READY
                Log.e(TAG, "Çıkarım sırasında hata: ${e.message}", e)
                withContext(Dispatchers.Main) {
                    onError(e)
                }
            }
        }
    }

    /**
     * Model dosyasını bul:
     * 1. Uygulamanın özel 'files/models' klasöründe var mı?
     * 2. APK'nın 'assets/models/' klasörüne paketlenmiş mi?
     * 3. Kullanıcının İndirilenler klasöründe var mı?
     */
    private fun getOrExtractModelFile(): File? {
        val modelsDir = File(context.filesDir, "models").apply { mkdirs() }
        val targetInternalFile = File(modelsDir, MODEL_FILENAME)

        // 1. Zaten dahili depolamaya çıkartılmış ve boyutu doğruysa direkt kullan
        if (targetInternalFile.exists() && targetInternalFile.length() > 100_000_000L) {
            return targetInternalFile
        }

        // 2. APK'nın assets/models/ klasörüne gömülü ise güvenle dahili depolamaya kopyala
        try {
            val assetList = context.assets.list("models") ?: emptyArray()
            if (MODEL_FILENAME in assetList || ALT_MODEL_FILENAME in assetList) {
                val assetName = if (MODEL_FILENAME in assetList) MODEL_FILENAME else ALT_MODEL_FILENAME
                Log.i(TAG, "APK asset paketinden model çıkartılıyor: models/$assetName")
                context.assets.open("models/$assetName").use { inputStream ->
                    copyStreamToFile(inputStream, targetInternalFile)
                }
                return targetInternalFile
            }
        } catch (e: Throwable) {
            Log.d(TAG, "Asset kontrolü tamamlandı: ${e.message}")
        }

        // 3. Kullanıcının cihazındaki Downloads klasörünü kontrol et
        val downloadPaths = listOf(
            File("/storage/emulated/0/Download", MODEL_FILENAME),
            File("/storage/emulated/0/Download", ALT_MODEL_FILENAME),
            File(context.getExternalFilesDir(null), MODEL_FILENAME)
        )

        for (extFile in downloadPaths) {
            if (extFile.exists() && extFile.length() > 100_000_000L) {
                Log.i(TAG, "Model dosyası harici depolamada bulundu: ${extFile.absolutePath}")
                return extFile
            }
        }

        return null
    }

    /**
     * Büyük model dosyalarını bellek şişmesi yapmadan 64 KB'lık tamponlarla kopyala.
     */
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

    /**
     * Belleği ve GPU kaynaklarını serbest bırak.
     */
    fun close() {
        try {
            conversation?.close()
            conversation = null
            engine?.close()
            engine = null
        } catch (e: Throwable) {
            Log.w(TAG, "Kaynaklar kapatılırken uyarı: ${e.message}")
        } finally {
            _state.value = State.NOT_INITIALIZED
        }
    }
}
