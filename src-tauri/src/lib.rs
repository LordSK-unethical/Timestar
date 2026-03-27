use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![create_alarm_window])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn create_alarm_window(app: tauri::AppHandle, alarm_label: String, alarm_time: String) -> Result<(), String> {
    let label = "alarm";
    
    if app.get_webview_window(label).is_some() {
        return Ok(());
    }

    let url = format!("/alarm?label={}&time={}", 
        urlencoding::encode(&alarm_label), 
        urlencoding::encode(&alarm_time)
    );

    let _window = WebviewWindowBuilder::new(&app, label, WebviewUrl::App(url.into()))
        .title("TimeStar Alarm")
        .inner_size(400.0, 500.0)
        .resizable(false)
        .decorations(false)
        .always_on_top(true)
        .center()
        .transparent(true)
        .skip_taskbar(true)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}