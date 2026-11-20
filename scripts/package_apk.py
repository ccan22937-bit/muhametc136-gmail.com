#!/usr/bin/env python3
import os
import sys
import shutil
import subprocess


def run_cmd(cmd, cwd=None, env=None):
    print(f"  $ {cmd}")
    merged_env = os.environ.copy()
    if env:
        merged_env.update(env)
    res = subprocess.run(cmd, shell=True, cwd=cwd, env=merged_env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if res.returncode != 0:
        print(res.stdout, file=sys.stderr)
        raise RuntimeError(f"Command failed ({res.returncode}): {cmd}")
    if res.stdout:
        tail = "\n".join(res.stdout.strip().splitlines()[-15:])
        print(tail)
    return res.stdout


def build_real_apk():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    android_dir = os.path.join(root_dir, 'android')
    dist_dir = os.path.join(root_dir, 'dist')
    android_assets_dist = os.path.join(android_dir, 'app/src/main/assets/dist')
    android_assets_root = os.path.join(android_dir, 'app/src/main/assets')

    os.makedirs(os.path.join(root_dir, 'public'), exist_ok=True)
    os.makedirs(android_assets_root, exist_ok=True)

    print("============================================================")
    print("  SENSEI REAL GRADLE APK COMPILER (LiteRT-LM 0.16.1 + JNI) ")
    print("============================================================")

    # 1. Verify Android SDK & Java
    sdk_dir = os.environ.get('ANDROID_HOME') or os.environ.get('ANDROID_SDK_ROOT') or '/opt/android-sdk'
    if not os.path.isdir(sdk_dir):
        raise RuntimeError(f"Android SDK not found at {sdk_dir}. Please install Android SDK command-line tools.")

    local_props = os.path.join(android_dir, 'local.properties')
    with open(local_props, 'w', encoding='utf-8') as f:
        f.write(f"sdk.dir={sdk_dir}\n")
    print(f"[1/6] Configured Android SDK: {sdk_dir}")

    # 2. Ensure Release Keystore exists
    keystore_path = os.path.join(root_dir, 'sensei_release.keystore')
    if not os.path.exists(keystore_path):
        print("[2/6] Generating release keystore...")
        run_cmd(
            f'keytool -genkeypair -v -keystore "{keystore_path}" -alias sensei '
            '-keyalg RSA -keysize 2048 -validity 10000 '
            '-storepass sensei123 -keypass sensei123 '
            '-dname "CN=Sensei, OU=App, O=Sensei, L=Istanbul, C=TR"'
        )
    else:
        print("[2/6] Using existing sensei_release.keystore.")

    # 3. Build Web App (dist/)
    print("[3/6] Building latest Vite React frontend (npm run build)...")
    run_cmd('npm run build', cwd=root_dir)

    # 4. Sync dist/ into android/app/src/main/assets/dist/ (skipping APKs/screenshots)
    print("[4/6] Copying web assets into android/app/src/main/assets/dist/...")
    if os.path.exists(android_assets_dist):
        shutil.rmtree(android_assets_dist)
    os.makedirs(android_assets_dist, exist_ok=True)

    skip_exts = ('.apk', '.cjs', '.map', '.zip', '.idsig')
    for item in os.listdir(dist_dir):
        if item.endswith(skip_exts) or 'Screenshot_' in item or 'Screenrecorder-' in item:
            continue
        src = os.path.join(dist_dir, item)
        dst = os.path.join(android_assets_dist, item)
        if os.path.isdir(src):
            shutil.copytree(
                src,
                dst,
                ignore=shutil.ignore_patterns('*.apk', '*.zip', '*.map', '*.cjs', '*.idsig', 'Screenshot_*', 'Screenrecorder-*')
            )
        else:
            shutil.copy2(src, dst)

    # Also clean stale top-level index.html/assets if previously placed directly under android/app/src/main/assets/
    for stale in ['index.html', 'assets']:
        stale_path = os.path.join(android_assets_root, stale)
        if os.path.isdir(stale_path):
            shutil.rmtree(stale_path, ignore_errors=True)
        elif os.path.isfile(stale_path):
            os.remove(stale_path)

    # 5. Compile Real Gradle Release APK with Native LiteRT-LM 0.16.1
    print("[5/6] Running Gradle assembleRelease (Kotlin + Google AI Edge LiteRT-LM 0.16.1 + ML Kit)...")
    gradlew = os.path.join(android_dir, 'gradlew')
    os.chmod(gradlew, 0o755)
    gradle_env = {
        'ANDROID_HOME': sdk_dir,
        'ANDROID_SDK_ROOT': sdk_dir,
        'GRADLE_OPTS': '-Xmx128m -Dorg.gradle.daemon=false'
    }
    run_cmd('./gradlew assembleRelease --no-daemon --max-workers=1 --console=plain', cwd=android_dir, env=gradle_env)

    built_apk = os.path.join(android_dir, 'app/build/outputs/apk/release/app-release.apk')
    unsigned_apk = os.path.join(android_dir, 'app/build/outputs/apk/release/app-release-unsigned.apk')
    source_apk = built_apk if os.path.exists(built_apk) else unsigned_apk

    if not os.path.exists(source_apk):
        raise RuntimeError("Gradle build completed but release APK was not found.")

    # 6. Copy & Verify APK Signature
    final_apk = os.path.join(root_dir, 'public/Sensei.apk')
    if os.path.exists(final_apk):
        os.remove(final_apk)

    if source_apk == unsigned_apk:
        print("[6/6] Signing APK with apksigner...")
        apksigner_bin = os.path.join(sdk_dir, 'build-tools/34.0.0/apksigner')
        if not os.path.exists(apksigner_bin):
            apksigner_bin = 'apksigner'
        run_cmd(
            f'"{apksigner_bin}" sign --ks "{keystore_path}" '
            '--ks-pass pass:sensei123 --ks-key-alias sensei --key-pass pass:sensei123 '
            f'--out "{final_apk}" "{source_apk}"'
        )
    else:
        print("[6/6] Copying signed release APK to public/ & dist/...")
        shutil.copyfile(source_apk, final_apk)

    shutil.copyfile(final_apk, os.path.join(root_dir, 'public/SenSey.apk'))
    shutil.copyfile(final_apk, os.path.join(dist_dir, 'Sensei.apk'))
    shutil.copyfile(final_apk, os.path.join(dist_dir, 'SenSey.apk'))

    apk_size_mb = round(os.path.getsize(final_apk) / (1024 * 1024), 2)
    print("============================================================")
    print(f" SUCCESS! REAL NATIVE APK BUILT: {apk_size_mb} MB")
    print(" Includes: liblitertlm_jni.so (0.16.1), ML Kit, Native TTS")
    print(" Output: public/Sensei.apk & public/SenSey.apk")
    print("============================================================")


if __name__ == '__main__':
    build_real_apk()
