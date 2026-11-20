package com.sensei.bingelingo.ai

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.os.Environment
import android.provider.OpenableColumns
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL

/**
 * AssetLoader
 *
 * Service managing model selection via Android's ACTION_OPEN_DOCUMENT (SAF),
 * zero-copy discovery in system Downloads, or genuine HTTP download directly
 * into app private storage (`context.filesDir/models/gemma3-1b-it-int4.litertlm`).
 */
class AssetLoader(private val context: Context) {

    companion object {
        const val PREFS_NAME = "sensei_asset_loader_prefs"
        const val KEY_PERSISTED_MODEL_URI = "persisted_model_uri"
        const val KEY_PERSISTED_MODEL_NAME = "persisted_model_name"
        const val MODEL_FILENAME = "gemma3-1b-it-int4.litertlm"
        const val ALT_MODEL_FILENAME = "gemma-3-1b-it-gpu.litertlm"
        const val MIN_MODEL_SIZE_BYTES = 100_000_000L // Min 100 MB valid quantized LLM
        const val DEFAULT_PUBLIC_LITERTLM_URL =
            "https://huggingface.co/lotapa/gemma3-1b-it-int4.litertlm/resolve/main/gemma3-1b-it-int4.litertlm"
    }

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun createOpenDocumentIntent(): Intent {
        return Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
            putExtra(
                Intent.EXTRA_MIME_TYPES,
                arrayOf(
                    "*/*",
                    "application/octet-stream",
                    "application/x-binary",
                    "application/binary",
                    "application/x-litertlm"
                )
            )
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
        }
    }

    fun persistUriPermission(uri: Uri, intentFlags: Int = Intent.FLAG_GRANT_READ_URI_PERMISSION): Boolean {
        return try {
            val takeFlags = (intentFlags and Intent.FLAG_GRANT_READ_URI_PERMISSION).let {
                if (it != 0) it else Intent.FLAG_GRANT_READ_URI_PERMISSION
            }
            context.contentResolver.takePersistableUriPermission(uri, takeFlags)

            val fileName = queryFileName(uri) ?: MODEL_FILENAME
            prefs.edit()
                .putString(KEY_PERSISTED_MODEL_URI, uri.toString())
                .putString(KEY_PERSISTED_MODEL_NAME, fileName)
                .apply()
            true
        } catch (e: Exception) {
            e.printStackTrace()
            prefs.edit()
                .putString(KEY_PERSISTED_MODEL_URI, uri.toString())
                .apply()
            false
        }
    }

    fun getPersistedModelUri(): Uri? {
        val uriString = prefs.getString(KEY_PERSISTED_MODEL_URI, null) ?: return null
        return try {
            val uri = Uri.parse(uriString)
            val hasPermission = context.contentResolver.persistedUriPermissions.any {
                it.uri == uri && it.isReadPermission
            }
            if (hasPermission || isUriAccessible(uri)) uri else null
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Imports a user-selected .litertlm model file from SAF URI into app storage.
     * Note: If the exact file already exists readable in Download/ with the same size,
     * uses it directly without duplicating storage!
     */
    suspend fun loadModelFromUri(
        uri: Uri,
        onProgress: (percent: Int, copiedBytes: Long, totalBytes: Long) -> Unit = { _, _, _ -> }
    ): File = withContext(Dispatchers.IO) {
        val selectedName = queryFileName(uri) ?: MODEL_FILENAME
        val directDownloadCandidate = findReadableDownloadModel(selectedName)
        if (directDownloadCandidate != null) {
            val len = directDownloadCandidate.length()
            onProgress(100, len, len)
            return@withContext directDownloadCandidate
        }

        val targetDir = File(context.filesDir, "models")
        if (!targetDir.exists()) targetDir.mkdirs()

        val targetFile = File(targetDir, MODEL_FILENAME)
        val tempFile = File(targetDir, "$MODEL_FILENAME.tmp")

        var inputStream: InputStream? = null
        var outputStream: FileOutputStream? = null

        try {
            if (tempFile.exists()) tempFile.delete()

            val contentResolver = context.contentResolver
            val totalBytes = try {
                val pfd = contentResolver.openFileDescriptor(uri, "r")
                val size = pfd?.statSize ?: -1L
                pfd?.close()
                size
            } catch (e: Exception) {
                -1L
            }

            if (targetFile.exists() && totalBytes > 0 && targetFile.length() == totalBytes) {
                onProgress(100, totalBytes, totalBytes)
                return@withContext targetFile
            }

            inputStream = contentResolver.openInputStream(uri)
                ?: throw IllegalStateException("Model dosyası açılamadı: $uri")

            outputStream = FileOutputStream(tempFile)
            val buffer = ByteArray(1024 * 256)
            var bytesCopied: Long = 0
            var read: Int
            var lastReportedPercent = -1

            while (inputStream.read(buffer).also { read = it } != -1) {
                outputStream.write(buffer, 0, read)
                bytesCopied += read

                val percent = if (totalBytes > 0) {
                    ((bytesCopied * 100) / totalBytes).toInt().coerceIn(0, 99)
                } else {
                    ((bytesCopied * 100) / 600_000_000L).toInt().coerceIn(0, 99)
                }

                if (percent != lastReportedPercent) {
                    lastReportedPercent = percent
                    val reportedTotal = if (totalBytes > 0) totalBytes else bytesCopied
                    onProgress(percent, bytesCopied, reportedTotal)
                }
            }

            outputStream.flush()
            outputStream.close()
            inputStream.close()

            if (targetFile.exists()) targetFile.delete()

            var renamed = tempFile.renameTo(targetFile)
            if (!renamed || !targetFile.exists()) {
                tempFile.inputStream().use { input ->
                    targetFile.outputStream().use { output ->
                        input.copyTo(output)
                    }
                }
                tempFile.delete()
                renamed = targetFile.exists()
            }

            if (!renamed || targetFile.length() < MIN_MODEL_SIZE_BYTES) {
                throw IllegalStateException(
                    "Seçilen dosya geçerli bir Gemma 3 modeli değil (Boyut: ${targetFile.length() / (1024 * 1024)} MB, Minimum: 100 MB)."
                )
            }

            onProgress(100, targetFile.length(), targetFile.length())
            targetFile
        } finally {
            try {
                outputStream?.close()
                inputStream?.close()
                if (tempFile.exists()) tempFile.delete()
            } catch (_: Exception) {
            }
        }
    }

    /**
     * Genuine HTTP downloader for the open-source .litertlm model into app private storage.
     * Supports 301/302/307/308 redirects (e.g. HuggingFace CDN).
     */
    suspend fun downloadModelFromUrl(
        urlString: String = DEFAULT_PUBLIC_LITERTLM_URL,
        onProgress: (percent: Int, downloadedBytes: Long, totalBytes: Long) -> Unit = { _, _, _ -> }
    ): File = withContext(Dispatchers.IO) {
        val targetDir = File(context.filesDir, "models")
        if (!targetDir.exists()) targetDir.mkdirs()

        val targetFile = File(targetDir, MODEL_FILENAME)
        val tempFile = File(targetDir, "$MODEL_FILENAME.dl.tmp")
        if (tempFile.exists()) tempFile.delete()

        var currentUrl = urlString.ifBlank { DEFAULT_PUBLIC_LITERTLM_URL }
        var conn: HttpURLConnection? = null
        var redirects = 0

        try {
            while (redirects < 8) {
                val url = URL(currentUrl)
                conn = (url.openConnection() as HttpURLConnection).apply {
                    instanceFollowRedirects = false
                    connectTimeout = 25000
                    readTimeout = 60000
                    setRequestProperty("User-Agent", "Sensei-Android/3.1")
                }
                val code = conn.responseCode
                if (code in 300..399) {
                    val location = conn.getHeaderField("Location")
                        ?: throw IllegalStateException("Yönlendirme adresi boş ($code).")
                    conn.disconnect()
                    currentUrl = URL(url, location).toString()
                    redirects++
                } else if (code in 200..299) {
                    break
                } else {
                    conn.disconnect()
                    throw IllegalStateException("Model indirilemedi: HTTP $code")
                }
            }

            val activeConn = conn ?: throw IllegalStateException("Bağlantı kurulamadı.")
            val totalBytes = activeConn.contentLengthLong.let { if (it > 0) it else 584_400_000L }

            activeConn.inputStream.use { input ->
                FileOutputStream(tempFile).use { output ->
                    val buffer = ByteArray(1024 * 256)
                    var downloaded: Long = 0
                    var read: Int
                    var lastPercent = -1

                    while (input.read(buffer).also { read = it } != -1) {
                        output.write(buffer, 0, read)
                        downloaded += read
                        val percent = ((downloaded * 100) / totalBytes).toInt().coerceIn(0, 99)
                        if (percent != lastPercent) {
                            lastPercent = percent
                            onProgress(percent, downloaded, totalBytes)
                        }
                    }
                    output.flush()
                }
            }
            activeConn.disconnect()

            if (!tempFile.exists() || tempFile.length() < MIN_MODEL_SIZE_BYTES) {
                throw IllegalStateException("İndirilen model dosyası eksik veya bozuk (${tempFile.length()} bytes).")
            }

            if (targetFile.exists()) targetFile.delete()
            if (!tempFile.renameTo(targetFile)) {
                tempFile.inputStream().use { inp -> targetFile.outputStream().use { out -> inp.copyTo(out) } }
                tempFile.delete()
            }

            onProgress(100, targetFile.length(), targetFile.length())
            targetFile
        } finally {
            conn?.disconnect()
            if (tempFile.exists()) tempFile.delete()
        }
    }

    suspend fun autoPrepareBundledModel(
        onProgress: (percent: Int, copiedBytes: Long, totalBytes: Long) -> Unit = { _, _, _ -> }
    ): File? = withContext(Dispatchers.IO) {
        val active = getActiveModelFile()
        if (active.exists() && active.length() >= MIN_MODEL_SIZE_BYTES) {
            return@withContext active
        }

        val candidates = listOf(
            "models/$MODEL_FILENAME",
            "models/$ALT_MODEL_FILENAME",
            MODEL_FILENAME,
            ALT_MODEL_FILENAME
        )

        var foundAssetPath: String? = null
        for (candidate in candidates) {
            try {
                val stream = context.assets.open(candidate)
                val available = stream.available()
                stream.close()
                if (available > 0) {
                    foundAssetPath = candidate
                    break
                }
            } catch (_: Exception) {
            }
        }

        if (foundAssetPath == null) {
            return@withContext if (hasValidModel()) getActiveModelFile() else null
        }

        val targetDir = File(context.filesDir, "models")
        if (!targetDir.exists()) targetDir.mkdirs()
        val targetFile = File(targetDir, MODEL_FILENAME)
        val tempFile = File(targetDir, "$MODEL_FILENAME.extracting")

        try {
            if (tempFile.exists()) tempFile.delete()
            val inputStream = context.assets.open(foundAssetPath)
            val outputStream = FileOutputStream(tempFile)
            val buffer = ByteArray(1024 * 512)
            var bytesCopied: Long = 0
            var read: Int
            var lastPercent = -1

            val totalBytes = try {
                val fd = context.assets.openFd(foundAssetPath)
                val len = fd.length
                fd.close()
                if (len > 0) len else 584_400_000L
            } catch (_: Exception) {
                584_400_000L
            }

            while (inputStream.read(buffer).also { read = it } != -1) {
                outputStream.write(buffer, 0, read)
                bytesCopied += read
                val percent = ((bytesCopied * 100) / totalBytes).toInt().coerceIn(0, 99)
                if (percent != lastPercent) {
                    lastPercent = percent
                    onProgress(percent, bytesCopied, totalBytes)
                }
            }
            outputStream.flush()
            outputStream.close()
            inputStream.close()

            if (targetFile.exists()) targetFile.delete()
            tempFile.renameTo(targetFile)
            onProgress(100, targetFile.length(), targetFile.length())
            targetFile
        } catch (e: Exception) {
            e.printStackTrace()
            if (tempFile.exists()) tempFile.delete()
            null
        }
    }

    private fun findReadableDownloadModel(fileName: String): File? {
        val downloadDirs = listOfNotNull(
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
            File("/storage/emulated/0/Download"),
            File("/sdcard/Download"),
            context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
        )
        for (dir in downloadDirs) {
            if (dir.exists()) {
                val exact = File(dir, fileName)
                if (exact.exists() && exact.length() >= MIN_MODEL_SIZE_BYTES && exact.canRead()) {
                    return exact
                }
            }
        }
        return null
    }

    fun getActiveModelFile(): File {
        val primaryPrivate = File(context.filesDir, "models/$MODEL_FILENAME")
        if (primaryPrivate.exists() && primaryPrivate.length() >= MIN_MODEL_SIZE_BYTES) {
            return primaryPrivate
        }

        val altPrivate = File(context.filesDir, "models/$ALT_MODEL_FILENAME")
        if (altPrivate.exists() && altPrivate.length() >= MIN_MODEL_SIZE_BYTES) {
            return altPrivate
        }

        val downloadDirs = listOfNotNull(
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
            File("/storage/emulated/0/Download"),
            File("/sdcard/Download"),
            context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
        )

        for (dir in downloadDirs) {
            if (dir.exists()) {
                val modelFile = File(dir, MODEL_FILENAME)
                if (modelFile.exists() && modelFile.length() >= MIN_MODEL_SIZE_BYTES && modelFile.canRead()) {
                    return modelFile
                }
                val altModelFile = File(dir, ALT_MODEL_FILENAME)
                if (altModelFile.exists() && altModelFile.length() >= MIN_MODEL_SIZE_BYTES && altModelFile.canRead()) {
                    return altModelFile
                }
            }
        }

        return primaryPrivate
    }

    fun hasValidModel(): Boolean {
        val file = getActiveModelFile()
        return file.exists() && file.length() >= MIN_MODEL_SIZE_BYTES
    }

    fun getModelSizeBytes(): Long {
        val file = getActiveModelFile()
        return if (file.exists()) file.length() else 0L
    }

    fun getModelPath(): String = getActiveModelFile().absolutePath

    fun clearPersistedModel(): Boolean {
        prefs.edit().clear().apply()
        val privateFile = File(context.filesDir, "models/$MODEL_FILENAME")
        val altFile = File(context.filesDir, "models/$ALT_MODEL_FILENAME")
        var deleted = true
        if (privateFile.exists()) deleted = deleted && privateFile.delete()
        if (altFile.exists()) deleted = deleted && altFile.delete()
        return deleted
    }

    private fun isUriAccessible(uri: Uri): Boolean {
        return try {
            context.contentResolver.openFileDescriptor(uri, "r")?.use { true } ?: false
        } catch (_: Exception) {
            false
        }
    }

    private fun queryFileName(uri: Uri): String? {
        return try {
            context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (cursor.moveToFirst() && nameIndex != -1) {
                    cursor.getString(nameIndex)
                } else null
            }
        } catch (_: Exception) {
            null
        }
    }
}
