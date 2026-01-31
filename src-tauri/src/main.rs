// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod video;

use commands::{convert_videos, get_video_info, select_videos};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            select_videos,
            get_video_info,
            convert_videos
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
