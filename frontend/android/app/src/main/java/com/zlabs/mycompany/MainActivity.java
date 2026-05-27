package com.zlabs.mycompany;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

import java.util.Locale;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        final View root = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars()
                            | WindowInsetsCompat.Type.displayCutout()
            );
            float density = getResources().getDisplayMetrics().density;
            WebView webView = bridge.getWebView();
            if (webView != null) {
                String js = String.format(Locale.US,
                        "(function(){var s=document.documentElement.style;" +
                                "s.setProperty('--sai-top','%.2fpx');" +
                                "s.setProperty('--sai-right','%.2fpx');" +
                                "s.setProperty('--sai-bottom','%.2fpx');" +
                                "s.setProperty('--sai-left','%.2fpx');" +
                                "})();",
                        bars.top / density,
                        bars.right / density,
                        bars.bottom / density,
                        bars.left / density
                );
                webView.post(() -> webView.evaluateJavascript(js, null));
            }
            return WindowInsetsCompat.CONSUMED;
        });
    }
}
