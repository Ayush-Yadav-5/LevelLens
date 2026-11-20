# LevelLens Mobile & Tablet Native App Guide (Capacitor)

This guide details how to package LevelLens into an offline-ready **native Android (.apk) and iPad/iOS app** using **Capacitor**, preserving **100% of your existing React, Vite, and Tailwind CSS code** without breaking the web version.

---

## 1. Why Capacitor?

* **Single Codebase:** 100% of your UI, components, and logic stay identical for Web, Android tablets, and iPads.
* **100% Offline-Ready:** The compiled assets (`dist/`) are packaged directly inside the app binary, eliminating internet dependencies.
* **Hardware Mic Access:** Seamless microphone capture for oral reading diagnostics without intrusive browser permission prompts.

---

## 2. Prerequisites

1. **Node.js** (v18+) & **npm** installed.
2. **Android Studio** (for building Android `.apk` / `.aab`):
   * Download and install [Android Studio](https://developer.android.com/studio).
   * Install the **Android SDK Platform** (API 33 or higher) and **Android SDK Build-Tools** via Android Studio SDK Manager.

---

## 3. Step-by-Step Setup Guide

### Step 1: Install Capacitor Dependencies
Run this in the project root:
```powershell
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### Step 2: Initialize Capacitor Config
Initialize the project configuration:
```powershell
npx cap init LevelLens com.levellens.app --web-dir dist
```
*This generates a `capacitor.config.json` linking Capacitor to your Vite `dist/` directory.*

### Step 3: Add the Android Platform
```powershell
npx cap add android
```
*This creates an `android/` native project folder containing the native Gradle configuration.*

---

## 4. Build & Sync Workflow

Whenever you make changes to your React components, sync them to the native app with this 2-step command:

```powershell
# 1. Build the production web bundle
npm run build

# 2. Copy the bundle to the native Android project
npx cap sync
```

---

## 5. Testing & Exporting the APK

### Open in Android Studio
```powershell
npx cap open android
```

### In Android Studio:
1. **Run on a Device / Tablet:**
   * Enable **Developer Options** and **USB Debugging** on your Android tablet or phone.
   * Plug the tablet into your PC via USB.
   * Click the green **Run (▶)** button in Android Studio to launch LevelLens on the tablet.
2. **Generate a Standalone `.apk` File:**
   * Go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
   * Android Studio will output an installable `.apk` file that you can transfer and install on any school tablet via USB or Google Drive.

---

## 6. Layout & Responsiveness on Mobile / Tablets

### Will it affect the layout?
**No.** Capacitor runs inside a native high-performance Webview (Chromium on Android / WebKit on iOS). 

* **Identical Rendering:** Whatever you see in Chrome when toggling DevTools to "Mobile" or "Tablet" view is **1:1 identical** inside the native app.
* **Tailwind Breakpoints:** All existing responsive Tailwind classes (`sm:`, `md:`, `lg:`, `grid-cols-1 lg:grid-cols-3`) work out of the box.
* **Touch-Optimized:** Taps, button active states, and audio recording triggers feel like native touch interactions.

### Best Practice: Safe Area Insets (Notches & Home Bars)
If running on modern edge-to-edge phones or tablets with camera notches, ensure `index.html` has `viewport-fit=cover`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```
And add standard safe-area padding utility in CSS if needed:
```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
```
