package com.sensei.bingelingo.ai

import android.util.Log
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.Translator
import com.google.mlkit.nl.translate.TranslatorOptions
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

/**
 * OnDeviceTranslator:
 * Google ML Kit On-Device Translation engine directly embedded inside the Sensei Android application.
 * 
 * - Operates entirely locally on the user's phone (CPU/NPU).
 * - Zero cloud server cost, unlimited translations, runs completely offline.
 * - Bundled as an internal organ of Sensei (no separate app downloaded or displayed).
 */
object OnDeviceTranslator {
    private const val TAG = "SenseiTranslator"

    private val translators = mutableMapOf<String, Translator>()

    private val supportedLanguages = mapOf(
        "Türkçe" to TranslateLanguage.TURKISH,
        "tr" to TranslateLanguage.TURKISH,
        "İngilizce" to TranslateLanguage.ENGLISH,
        "en" to TranslateLanguage.ENGLISH,
        "Almanca" to TranslateLanguage.GERMAN,
        "de" to TranslateLanguage.GERMAN,
        "İspanyolca" to TranslateLanguage.SPANISH,
        "es" to TranslateLanguage.SPANISH,
        "Fransızca" to TranslateLanguage.FRENCH,
        "fr" to TranslateLanguage.FRENCH,
        "İtalyanca" to TranslateLanguage.ITALIAN,
        "it" to TranslateLanguage.ITALIAN,
        "Rusça" to TranslateLanguage.RUSSIAN,
        "ru" to TranslateLanguage.RUSSIAN,
        "Japonca" to TranslateLanguage.JAPANESE,
        "ja" to TranslateLanguage.JAPANESE,
        "Korece" to TranslateLanguage.KOREAN,
        "ko" to TranslateLanguage.KOREAN,
        "Çince" to TranslateLanguage.CHINESE,
        "zh" to TranslateLanguage.CHINESE,
        "Arapça" to TranslateLanguage.ARABIC,
        "ar" to TranslateLanguage.ARABIC
    )

    fun getLanguageCode(lang: String): String? {
        return supportedLanguages[lang] ?: supportedLanguages[lang.lowercase()]
    }

    suspend fun translate(
        text: String,
        sourceLang: String = "Türkçe",
        targetLang: String = "İngilizce"
    ): String {
        if (text.isBlank()) return ""

        val srcCode = getLanguageCode(sourceLang) ?: TranslateLanguage.TURKISH
        val tgtCode = getLanguageCode(targetLang) ?: TranslateLanguage.ENGLISH

        if (srcCode == tgtCode) return text

        val pairKey = "$srcCode->$tgtCode"

        val translator = translators.getOrPut(pairKey) {
            val options = TranslatorOptions.Builder()
                .setSourceLanguage(srcCode)
                .setTargetLanguage(tgtCode)
                .build()
            Translation.getClient(options)
        }

        return try {
            ensureModelDownloaded(translator)
            suspendCancellableCoroutine { continuation ->
                translator.translate(text)
                    .addOnSuccessListener { translatedText ->
                        if (continuation.isActive) {
                            continuation.resume(translatedText)
                        }
                    }
                    .addOnFailureListener { e ->
                        Log.w(TAG, "On-device translation failed, returning source text: ${e.message}")
                        if (continuation.isActive) {
                            continuation.resume(text)
                        }
                    }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error during ML Kit on-device translation", e)
            text
        }
    }

    private suspend fun ensureModelDownloaded(translator: Translator) {
        suspendCancellableCoroutine<Unit> { continuation ->
            val conditions = DownloadConditions.Builder()
                .build() // Downloads over Wi-Fi or cellular transparently in background
            translator.downloadModelIfNeeded(conditions)
                .addOnSuccessListener {
                    if (continuation.isActive) {
                        continuation.resume(Unit)
                    }
                }
                .addOnFailureListener { exception ->
                    Log.w(TAG, "Model download issue: ${exception.message}")
                    if (continuation.isActive) {
                        continuation.resume(Unit)
                    }
                }
        }
    }

    fun close() {
        translators.values.forEach { it.close() }
        translators.clear()
    }
}
