use tauri::{include_image, Manager};

const APP_ICON: tauri::image::Image<'_> = include_image!("icons/32x32.png");

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            for (_, window) in app.webview_windows() {
                let _ = window.set_icon(APP_ICON.clone());
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
