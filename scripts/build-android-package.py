import os
import zipfile
import shutil

ROOT_DIR = "/app/applet"
PUBLIC_DIR = os.path.join(ROOT_DIR, "public")
ZIP_OUT = os.path.join(PUBLIC_DIR, "daftar-hooshmand-android-package.zip")

manifest_xml = '''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="ir.anbaryar.smartledger">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:label="انباریار و دفتر حساب"
        android:roundIcon="@drawable/ic_launcher"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
'''

main_activity_java = '''package ir.anbaryar.smartledger;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends Activity {
    private WebView webView;
    private static final int CAMERA_PERMISSION_CODE = 101;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Check camera permission for barcode scanner
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_CODE);
        }

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadsImagesAutomatically(true);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    request.grant(request.getResources());
                }
            }
        });

        // Load offline local app
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
'''

build_gradle = '''apply plugin: 'com.android.application'

android {
    compileSdkVersion 34
    defaultConfig {
        applicationId "ir.anbaryar.smartledger"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 3
        versionName "3.0.0"
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.core:core:1.12.0'
}
'''

readme_txt = '''==============================================================
راهنمای استفاده از پکیج اندروید و نرم‌افزار موبایل
سامانه جامع «انباریار و دفتر حساب هوشمند» (نسخه ۳.۰)
==============================================================

این بسته شامل دو روش کاملاً آماده و استاندارد برای داشتن نرم‌افزار موبایل است:

--------------------------------------------------------------
روش اول: نصب مستقیم روی گوشی در ۳ ثانیه (بدون نیاز به سیستم یا کامپیوتر)
--------------------------------------------------------------
۱. آدرس سامانه را در مرورگر Chrome یا Samsung Internet گوشی موبایل خود باز کنید.
۲. روی علامت سه‌نقطه بالای مرورگر (⋮) یا پیام ظاهر شده در پایین صفحه بزنید.
۳. گزینه «نصب برنامه» (Install App) یا «افزودن به صفحه اصلی» (Add to Home screen) را انتخاب نمایید.
۴. آیکون اختصاصی انباریار و دفتر حساب روی صفحه گوشی شما قرار می‌گیرد و به صورت آفلاین و تمام‌صفحه مانند یک اپلیکیشن اجرا خواهد شد.

--------------------------------------------------------------
روش دوم: خروجی فایل واقعی نصبی APK (برای ارسال در ایتا، تلگرام و بازار)
--------------------------------------------------------------
۱. به سایت معتبر و رسمی مایکروسافت: https://www.pwabuilder.com بروید.
۲. آدرس آنلاین سامانه‌تان را در کادر آن وارد کنید و دکمه Start را بزنید.
۳. در بخش Android روی دکمه "Package for Android" بزنید.
۴. در عرض چند ثانیه، فایل نصبی اختصاصی .apk آماده دانلود به شما داده می‌شود که می‌توانید آن را روی هر گوشی اندرویدی نصب کرده یا در کافه‌بازار و مایکت منتشر نمایید!

--------------------------------------------------------------
روش سوم: پروژه سورس کامل اندروید استودیو (برای توسعه‌دهندگان)
--------------------------------------------------------------
درون این فایل فشرده، پوشه android-project حاوی:
- کدهای کامل AndroidManifest.xml
- کد جاوا MainActivity.java مجهز به دسترسی کامل دوربین برای بارکدخوان و ذخیره‌سازی آفلاین
- پوشه assets حاوی تمام فایل‌های HTML، CSS و تصاویر برنامه
می‌باشد. کافی است پوشه را در Android Studio باز کرده و دکمه Run یا Build APK را بزنید.

--------------------------------------------------------------
صفحات و بخش‌های اصلی سامانه:
- صندوق فروش و بارکدخوان سریع: index.html
- دفتر حساب هوشمند مشتریان و نسیه: daftar.html
- پنل مدیریت انبار و گزارش سود: admin.html

با آرزوی موفقیت و رونق کسب و کار شما 🌹
==============================================================
'''

files_to_copy = [
    "index.html",
    "worker.html",
    "daftar.html",
    "admin.html",
    "style-worker.css",
    "style-invoice.css",
    "style-admin.css",
    "manifest.json",
    "manifest-daftar.json",
    "sw.js",
    "sw-daftar.js",
    "icon-192.png",
    "icon-512.png",
    "icon-maskable.png",
    "icon-daftar-192.png",
    "icon-daftar-512.png",
    "apple-touch-icon.png",
    "icon.svg",
    "icon-daftar.svg"
]

with zipfile.ZipFile(ZIP_OUT, 'w', zipfile.ZIP_DEFLATED) as z:
    # 1. README
    z.writestr("README-راهنمای-نصب-اندروید-APK.txt", readme_txt.encode('utf-8'))

    # 2. Offline Web App folder
    for fname in files_to_copy:
        fpath = os.path.join(PUBLIC_DIR, fname)
        if os.path.exists(fpath):
            z.write(fpath, arcname=f"offline-web-app/{fname}")

    # 3. Android Studio Project Structure
    z.writestr("android-project/app/src/main/AndroidManifest.xml", manifest_xml.encode('utf-8'))
    z.writestr("android-project/app/src/main/java/ir/anbaryar/smartledger/MainActivity.java", main_activity_java.encode('utf-8'))
    z.writestr("android-project/app/build.gradle", build_gradle.encode('utf-8'))

    # Android assets folder (offline files inside the APK)
    for fname in files_to_copy:
        fpath = os.path.join(PUBLIC_DIR, fname)
        if os.path.exists(fpath):
            z.write(fpath, arcname=f"android-project/app/src/main/assets/{fname}")

    # Drawable icon
    icon_path = os.path.join(PUBLIC_DIR, "icon-192.png")
    if os.path.exists(icon_path):
        z.write(icon_path, arcname="android-project/app/src/main/res/drawable/ic_launcher.png")

print(f"Android package ZIP successfully built at: {ZIP_OUT} (Size: {os.path.getsize(ZIP_OUT)} bytes)")
