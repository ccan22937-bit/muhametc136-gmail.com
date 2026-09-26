import React, { useState } from 'react';
import { X, Download, CheckCircle2, Copy, Smartphone, ExternalLink } from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';

interface GitHubApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubApkModal: React.FC<GitHubApkModalProps> = ({ isOpen, onClose }) => {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyText = (text: string, stepIndex: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepIndex);
    setTimeout(() => setCopiedStep(null), 2500);
  };

  const workflowCode = `name: Build Android APK

on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '9.3.1'

      - name: Prepare Keystore and Environment
        run: |
          if [ -f "debug.keystore.base64" ]; then
            base64 -d debug.keystore.base64 > debug.keystore
          else
            keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
          fi
          if [ ! -f ".env" ] && [ -f ".env.example" ]; then
            cp .env.example .env
          fi

      - name: Build Debug APK
        run: gradle :app:assembleDebug --no-daemon --stacktrace

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: App-Debug-APK
          path: app/build/outputs/apk/debug/*.apk`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl shadow-emerald-950/50 relative text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl text-white shadow-lg">
            <GithubIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              GitHub Actions ile Otomatik APK Üretimi
            </h2>
            <p className="text-xs text-emerald-400 font-medium">
              Bilgisayarında Android Studio olmadan GitHub bulutunda APK derleyin!
            </p>
          </div>
        </div>

        {/* Explanation Card */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl mb-6">
          <p className="text-sm text-emerald-100 leading-relaxed">
            🚀 Projeye özel <strong>`.github/workflows/build-apk.yml`</strong> iş akışı eklendi. GitHub sunucuları Java 17 ve Gradle 9.3.1 ile projenizi otomatik derler ve <strong>App-Debug-APK</strong> dosyasını indirilebilir hale getirir!
          </p>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-4 text-sm text-slate-300">
          {/* Step 1: ZIP Download */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-xs font-black">1</span>
                Proje Dosyalarını İndirin
              </span>
              <a
                href="/Sensei_Full_App_Source.zip"
                download="Sensei_GitHub_Project.zip"
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition"
              >
                <Download className="w-4 h-4" />
                ZIP İndir
              </a>
            </div>
            <p className="text-xs text-slate-400">
              İçinde tüm Android kodları, Gradle wrapper ve hazır GitHub Actions yapılandırması bulunmaktadır.
            </p>
          </div>

          {/* Step 2: Push to GitHub */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-xs font-black">2</span>
                GitHub Deponuza Yükleyin
              </span>
              <button
                onClick={() => copyText('git init\ngit add .\ngit commit -m "Sensei APK Init"\ngit branch -M main\ngit remote add origin https://github.com/KULLANICI_ADINIZ/sensei.git\ngit push -u origin main', 2)}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition"
              >
                {copiedStep === 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedStep === 2 ? 'Kopyalandı' : 'Komutları Kopyala'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-2.5 rounded-xl text-[11px] text-emerald-300 overflow-x-auto border border-slate-800 font-mono">
git init &amp;&amp; git add . &amp;&amp; git commit -m "Sensei Initial"
git remote add origin https://github.com/KULLANICI/sensei.git
git push -u origin main
            </pre>
          </div>

          {/* Step 3: Run Workflow */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-xs font-black">3</span>
              <span className="font-bold text-white">GitHub "Actions" Sekmesine Tıklayın</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              1. Deponuzdaki <strong>Actions</strong> sekmesine gidin.<br />
              2. <strong>"Build Android APK"</strong> seçeneğini seçin.<br />
              3. <strong>"Run workflow"</strong> butonuna basın.<br />
              4. İşlem bittiğinde Artifacts alanından <strong>App-Debug-APK</strong> dosyasını indirin!
            </p>
          </div>
        </div>

        {/* Workflow YML Code preview */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>.github/workflows/build-apk.yml İçeriği:</span>
            <button
              onClick={() => copyText(workflowCode, 99)}
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
            >
              {copiedStep === 99 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedStep === 99 ? 'Kopyalandı!' : 'Kopyala'}</span>
            </button>
          </div>
          <pre className="bg-slate-950 p-3 rounded-2xl text-[10px] text-slate-400 border border-slate-800 overflow-x-auto max-h-36 font-mono">
            {workflowCode}
          </pre>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition"
          >
            Kapat
          </button>
          <a
            href="https://github.com/new"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-lg shadow-emerald-950"
          >
            <GithubIcon className="w-4 h-4" />
            GitHub'da Yeni Repo Aç
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
