package com.onioniq.app;

import android.content.ContentValues;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;

import com.getcapacitor.BridgeActivity;

import java.io.OutputStream;

import android.util.Base64;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);

        getBridge().getWebView().addJavascriptInterface(
                new PDFSaver(),
                "AndroidPDF"
        );
    }


    // ==========================================
    // PDF SAVER
    // ==========================================

    public class PDFSaver {

        @JavascriptInterface
        public String savePDF(
                String base64Data,
                String fileName
        ) {

            try {

                byte[] pdfBytes =
                        Base64.decode(
                                base64Data,
                                Base64.DEFAULT
                        );


                // ==================================
                // ANDROID 10+
                // ==================================

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {

                    ContentValues values =
                            new ContentValues();

                    values.put(
                            MediaStore.Downloads.DISPLAY_NAME,
                            fileName
                    );

                    values.put(
                            MediaStore.Downloads.MIME_TYPE,
                            "application/pdf"
                    );

                    values.put(
                            MediaStore.Downloads.RELATIVE_PATH,
                            Environment.DIRECTORY_DOWNLOADS
                                    + "/OnionIQ"
                    );

                    android.content.ContentResolver resolver =
                            getContentResolver();

                    android.net.Uri uri =
                            resolver.insert(
                                    MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                                    values
                            );

                    if (uri == null) {

                        return "ERROR: Could not create PDF file";
                    }


                    OutputStream outputStream =
                            resolver.openOutputStream(uri);

                    if (outputStream == null) {

                        return "ERROR: Could not open PDF file";
                    }


                    outputStream.write(pdfBytes);

                    outputStream.flush();

                    outputStream.close();


                    return "SUCCESS";
                }


                // ==================================
                // OLD ANDROID
                // ==================================

                else {

                    java.io.File downloads =
                            Environment.getExternalStoragePublicDirectory(
                                    Environment.DIRECTORY_DOWNLOADS
                            );

                    java.io.File folder =
                            new java.io.File(
                                    downloads,
                                    "OnionIQ"
                            );

                    if (!folder.exists()) {

                        folder.mkdirs();
                    }


                    java.io.File file =
                            new java.io.File(
                                    folder,
                                    fileName
                            );


                    java.io.FileOutputStream output =
                            new java.io.FileOutputStream(file);

                    output.write(pdfBytes);

                    output.flush();

                    output.close();


                    return "SUCCESS";
                }


            } catch (Exception e) {

                e.printStackTrace();

                return "ERROR: " + e.getMessage();
            }
        }
    }
}
