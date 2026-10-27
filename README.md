# Tap Tap Tycoon — wrapper Android WebView

Proyek wrapper saja, BUKAN rewrite game. Logika game tidak diubah.

- Package: com.hozinking.gameTTT.TapTapTycoon
- Label: Tap Tap Tycoon, versionName 1.0.0.0 001_alpha, versionCode 1
- minSdk 21, targetSdk 34, compileSdk 34
- Satu MainActivity WebView: JavaScript + DOM storage aktif, memuat file:///android_asset/index.html, portrait.
- Manifest bersih: hanya INTERNET dan ACCESS_NETWORK_STATE; allowBackup=false, usesCleartextTraffic=false.
- Assets di app/src/main/assets/ disalin verbatim dari APK asli (index.html, style.css, game.js) — tidak diedit.
- Belum di-push, belum di-build di GitHub Actions, belum di-sign dengan keystore apa pun.
