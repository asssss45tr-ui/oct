package ir.anbariyar.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** پوسته‌ی WebView: صفحه‌ی برنامه را از سرور اجراشده در ترموکس (localhost:3000) باز می‌کند. */
public class MainActivity extends Activity {
    private static final String HOME = "http://localhost:3000/";
    private static final int REQ_CAM = 11, REQ_FILE = 12;
    private WebView web;
    private PermissionRequest pendingPerm;
    private ValueCallback<Uri[]> fileCb;

    private static final String ERR =
        "<html dir='rtl'><body style='font-family:sans-serif;text-align:center;padding:40px 20px;background:#f5f5f5'>"
        + "<h2>سرور روشن نیست</h2>"
        + "<p>در ترموکس سرور را اجرا کن:</p>"
        + "<pre dir='ltr' style='background:#222;color:#0f0;padding:12px;border-radius:8px'>cd ~/oct\nnpm run dev</pre>"
        + "<p>بعد دکمه‌ی زیر را بزن.</p>"
        + "<button style='font-size:18px;padding:12px 28px;border:0;border-radius:10px;background:#2563eb;color:#fff' "
        + "onclick=\"location.href='" + HOME + "'\">تلاش دوباره</button></body></html>";

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        web = new WebView(this);
        setContentView(web, new ViewGroup.LayoutParams(-1, -1));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        web.setWebViewClient(new WebViewClient() {
            @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r.isForMainFrame()) v.loadDataWithBaseURL(HOME, ERR, "text/html", "utf-8", null);
            }
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                String h = u.getHost() == null ? "" : u.getHost();
                if (h.equals("localhost") || h.equals("127.0.0.1")) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ex) {}
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onPermissionRequest(final PermissionRequest r) {
                runOnUiThread(new Runnable() { public void run() {
                    if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                        r.grant(r.getResources());
                    } else {
                        pendingPerm = r;
                        requestPermissions(new String[]{Manifest.permission.CAMERA}, REQ_CAM);
                    }
                }});
            }
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                try { startActivityForResult(p.createIntent(), REQ_FILE); }
                catch (Exception e) { fileCb = null; return false; }
                return true;
            }
        });
        web.loadUrl(HOME);
    }

    @Override public void onRequestPermissionsResult(int code, String[] p, int[] g) {
        if (code == REQ_CAM && pendingPerm != null) {
            if (g.length > 0 && g[0] == PackageManager.PERMISSION_GRANTED) pendingPerm.grant(pendingPerm.getResources());
            else pendingPerm.deny();
            pendingPerm = null;
        }
    }

    @Override protected void onActivityResult(int code, int res, Intent data) {
        if (code == REQ_FILE && fileCb != null) {
            fileCb.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data));
            fileCb = null;
        }
    }

    @Override public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }
}
