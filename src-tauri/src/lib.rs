//! TimeStar - Cross-platform clock application
//! 
//! This code is designed to compile for both desktop (Windows/macOS/Linux) and Android.
//! Desktop-only features (tray, global shortcuts, single instance) are conditionally compiled.

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AppTime {
    pub hours: u32,
    pub minutes: u32,
}

#[tauri::command]
fn get_current_time() -> String {
    use std::time::SystemTime;
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap();
    let secs = now.as_secs();
    let hours = (secs / 3600) % 24;
    let minutes = (secs / 60) % 60;
    format!("{:02}:{:02}", hours, minutes)
}

// ============================================
// DESKTOP-ONLY IMPORTS AND CODE
// These are wrapped in #[cfg(desktop)] to exclude Android
// ============================================

#[cfg(desktop)]
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};

#[cfg(desktop)]
use tauri_plugin_single_instance::init as single_instance_init;

#[cfg(desktop)]
use tauri_plugin_global_shortcut::Builder as GlobalShortcutBuilder;

// ============================================
// MAIN APPLICATION ENTRY POINT
// ============================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Start with base plugins available on all platforms
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![get_current_time]);

    // ============================================
    // DESKTOP-ONLY PLUGINS
    // Single instance and global shortcuts are desktop-only
    // ============================================
    
    #[cfg(desktop)]
    {
        // Single instance plugin - prevents multiple app instances on desktop
        builder = builder.plugin(single_instance_init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }));

        // Global shortcuts plugin for desktop keyboard shortcuts
        builder = builder.plugin(GlobalShortcutBuilder::new().build());
    }

    // ============================================
    // SETUP - Window, tray, and logging configuration
    // ============================================
    
    builder = builder.setup(|app| {
        // Logging plugin - available on all platforms in debug mode
        #[cfg(debug_assertions)]
        {
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log::LevelFilter::Info)
                    .build(),
            )?;
        }

        // ============================================
        // DESKTOP-ONLY: System tray setup
        // Tray icon and menu are desktop-only features
        // ============================================
        
        #[cfg(desktop)]
        {
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show = MenuItem::with_id(app, "show", "Show App", true, None::<&str>)?;
            let hide = MenuItem::with_id(app, "hide", "Hide App", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &hide, &quit])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;
        }

        Ok(())
    });

    // ============================================
    // DESKTOP-ONLY: Window event handling
    // Hide window on close instead of quitting (desktop behavior)
    // ============================================
    
    #[cfg(desktop)]
    {
        builder = builder.on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        });
    }

    // Run the application
    builder.run(tauri::generate_context!()).expect("error while running tauri application");
}
