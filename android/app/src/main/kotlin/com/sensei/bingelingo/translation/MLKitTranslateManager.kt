package com.sensei.bingelingo.translation

import android.content.Context
import android.util.Log
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.common.model.RemoteModelManager
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.TranslateRemoteModel
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.Translator
import com.google.mlkit.nl.translate.TranslatorOptions
import java.util.concurrent.ConcurrentHashMap

/**
 * Data representation of supported language in ML Kit
 */
data class MLKitLanguage(
    val code: String,
    val nameTr: String,
    val nameEn: String,
    val approxSizeBytes: Long = 30L * 1024L * 1024L // ~30 MB
)

/**
 * MLKitTranslateManager
 * 
 * Native Android Translation Organ powered by Google ML Kit Translation.
 * Stores 25-30MB language models locally on device for 100% offline, zero-quota translation.
 */
class MLKitTranslateManager(private val context: Context) {

    private val TAG = "MLKitTranslate"
    private val modelManager = RemoteModelManager.getInstance()
    private val translatorCache = ConcurrentHashMap<String, Translator>()

    companion object {
        // Supported common languages
        val SUPPORTED_LANGUAGES = listOf(
            MLKitLanguage("tr", "Türkçe", "Turkish"),
            MLKitLanguage("ja", "Japonca", "Japanese"),
            MLKitLanguage("en", "İngilizce", "English"),
            MLKitLanguage("de", "Almanca", "German"),
            MLKitLanguage("es", "İspanyolca", "Spanish"),
            MLKitLanguage("fr", "Fransızca", "French"),
            MLKitLanguage("it", "İtalyanca", "Italian"),
            MLKitLanguage("ko", "Korece", "Korean"),
            MLKitLanguage("ru", "Rusça", "Russian"),
            MLKitLanguage("ar", "Arapça", "Arabic"),
            MLKitLanguage("zh", "Çince", "Chinese")
        )

        /**
         * Normalizes language input (e.g. 'Japonca' -> 'ja', 'en-US' -> 'en', 'tr' -> 'tr')
         */
        fun normalizeLanguageCode(input: String): String {
            val lower = input.trim().lowercase()
            return when {
                lower == "tr" || lower.startsWith("tr-") || lower.contains("türk") -> TranslateLanguage.TURKISH
                lower == "ja" || lower.startsWith("ja-") || lower.contains("japon") -> TranslateLanguage.JAPANESE
                lower == "en" || lower.startsWith("en-") || lower.contains("ingiliz") || lower.contains("english") -> TranslateLanguage.ENGLISH
                lower == "de" || lower.startsWith("de-") || lower.contains("alman") || lower.contains("german") -> TranslateLanguage.GERMAN
                lower == "es" || lower.startsWith("es-") || lower.contains("ispanyol") || lower.contains("spanish") -> TranslateLanguage.SPANISH
                lower == "fr" || lower.startsWith("fr-") || lower.contains("fransız") || lower.contains("french") -> TranslateLanguage.FRENCH
                lower == "it" || lower.startsWith("it-") || lower.contains("italyan") || lower.contains("italian") -> TranslateLanguage.ITALIAN
                lower == "ko" || lower.startsWith("ko-") || lower.contains("kore") || lower.contains("korean") -> TranslateLanguage.KOREAN
                lower == "ru" || lower.startsWith("ru-") || lower.contains("rus") || lower.contains("russian") -> TranslateLanguage.RUSSIAN
                lower == "ar" || lower.startsWith("ar-") || lower.contains("arap") || lower.contains("arabic") -> TranslateLanguage.ARABIC
                lower == "zh" || lower.startsWith("zh-") || lower.contains("çin") || lower.contains("chinese") -> TranslateLanguage.CHINESE
                else -> {
                    // Try parsing directly from BCP-47 tag
                    TranslateLanguage.fromLanguageTag(lower) ?: TranslateLanguage.ENGLISH
                }
            }
        }
    }

    /**
     * Translates text between source and target language.
     * Automatically downloads model if needed (or checks on-device availability).
     */
    fun translate(
        text: String,
        sourceLang: String,
        targetLang: String,
        requireWifi: Boolean = false,
        onSuccess: (String) -> Unit,
        onError: (String) -> Unit
    ) {
        val srcCode = normalizeLanguageCode(sourceLang)
        val tgtCode = normalizeLanguageCode(targetLang)

        if (srcCode == tgtCode) {
            onSuccess(text)
            return
        }

        val cacheKey = "${srcCode}_to_${tgtCode}"
        val translator = translatorCache.getOrPut(cacheKey) {
            val options = TranslatorOptions.Builder()
                .setSourceLanguage(srcCode)
                .setTargetLanguage(tgtCode)
                .build()
            Translation.getClient(options)
        }

        val conditionsBuilder = DownloadConditions.Builder()
        if (requireWifi) {
            conditionsBuilder.requireWifi()
        }
        val conditions = conditionsBuilder.build()

        // Download model on-device (25-30MB) if not present, then execute translation
        translator.downloadModelIfNeeded(conditions)
            .addOnSuccessListener {
                translator.translate(text)
                    .addOnSuccessListener { translatedText ->
                        onSuccess(translatedText)
                    }
                    .addOnFailureListener { e ->
                        Log.e(TAG, "Translation execution failed", e)
                        onError("Çeviri hatası: ${e.localizedMessage ?: "Bilinmeyen hata"}")
                    }
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "Language model download failed", e)
                onError("Dil paketi indirilemedi (ML Kit): ${e.localizedMessage ?: "Bağlantı hatası"}")
            }
    }

    /**
     * Checks if a language model is downloaded on-device
     */
    fun isModelDownloaded(langCode: String, onResult: (Boolean) -> Unit) {
        val code = normalizeLanguageCode(langCode)
        val model = TranslateRemoteModel.Builder(code).build()
        modelManager.isModelDownloaded(model)
            .addOnSuccessListener { isDownloaded ->
                onResult(isDownloaded)
            }
            .addOnFailureListener {
                onResult(false)
            }
    }

    /**
     * Explicitly downloads a 25-30MB language model for offline use
     */
    fun downloadModel(
        langCode: String,
        requireWifi: Boolean = false,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        val code = normalizeLanguageCode(langCode)
        val model = TranslateRemoteModel.Builder(code).build()
        val conditionsBuilder = DownloadConditions.Builder()
        if (requireWifi) {
            conditionsBuilder.requireWifi()
        }
        val conditions = conditionsBuilder.build()

        modelManager.download(model, conditions)
            .addOnSuccessListener {
                Log.i(TAG, "Language model successfully downloaded: $code (~30MB)")
                onSuccess()
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "Failed downloading model $code", e)
                onError(e.localizedMessage ?: "İndirme başarısız")
            }
    }

    /**
     * Deletes a downloaded language model to free up ~30MB
     */
    fun deleteModel(
        langCode: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        val code = normalizeLanguageCode(langCode)
        val model = TranslateRemoteModel.Builder(code).build()
        modelManager.deleteDownloadedModel(model)
            .addOnSuccessListener {
                Log.i(TAG, "Language model deleted: $code")
                // Clear any cached translators with this language
                val iterator = translatorCache.entries.iterator()
                while (iterator.hasNext()) {
                    val entry = iterator.next()
                    if (entry.key.startsWith("${code}_") || entry.key.endsWith("_${code}")) {
                        try { entry.value.close() } catch (ignored: Exception) {}
                        iterator.remove()
                    }
                }
                onSuccess()
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "Failed deleting model $code", e)
                onError(e.localizedMessage ?: "Silme başarısız")
            }
    }

    /**
     * Gets all downloaded language models on device
     */
    fun getDownloadedModels(onResult: (List<String>) -> Unit) {
        modelManager.getDownloadedModels(TranslateRemoteModel::class.java)
            .addOnSuccessListener { models ->
                val list = models.map { it.language }
                onResult(list)
            }
            .addOnFailureListener {
                onResult(emptyList())
            }
    }

    /**
     * Closes and cleans all open translators
     */
    fun close() {
        for ((_, translator) in translatorCache) {
            try {
                translator.close()
            } catch (ignored: Exception) {}
        }
        translatorCache.clear()
    }
}
