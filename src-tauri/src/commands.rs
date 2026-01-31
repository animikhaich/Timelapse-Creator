use crate::video::{get_info, get_output_path, is_supported_format, VideoInfo, SUPPORTED_FORMATS};
use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use tauri::{Emitter, Window};
use tauri_plugin_dialog::DialogExt;

/// Result of video selection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectionResult {
    pub files: Vec<String>,
    pub count: usize,
}

/// Conversion request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversionRequest {
    pub files: Vec<String>,
    pub speed_multiplier: u32,
}

/// Conversion result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversionResult {
    pub success: bool,
    pub message: String,
    pub converted_count: usize,
    pub failed_count: usize,
    pub output_files: Vec<String>,
}

/// Progress event for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressEvent {
    pub current_file: usize,
    pub total_files: usize,
    pub filename: String,
    pub progress_percent: f64,
    pub status: String,
    pub output_path: Option<String>,
}

/// Open file dialog to select videos
#[tauri::command]
pub async fn select_videos(window: Window) -> Result<SelectionResult, String> {
    let formats_str = SUPPORTED_FORMATS.join(",");

    let result = window
        .dialog()
        .file()
        .add_filter("Video Files", &SUPPORTED_FORMATS.to_vec())
        .set_title("Select Videos for Timelapse")
        .blocking_pick_files();

    match result {
        Some(files) => {
            let paths: Vec<String> = files
                .iter()
                .filter_map(|f| f.as_path().map(|p| p.to_string_lossy().to_string()))
                .filter(|p| is_supported_format(p))
                .collect();

            Ok(SelectionResult {
                count: paths.len(),
                files: paths,
            })
        }
        None => Ok(SelectionResult {
            files: vec![],
            count: 0,
        }),
    }
}

/// Get information about selected videos
#[tauri::command]
pub async fn get_video_info(paths: Vec<String>) -> Result<Vec<VideoInfo>, String> {
    let infos: Vec<VideoInfo> = paths.iter().map(|p| get_info(p)).collect();
    Ok(infos)
}

/// Convert videos to timelapse
#[tauri::command]
pub async fn convert_videos(
    window: Window,
    request: ConversionRequest,
) -> Result<ConversionResult, String> {
    let total_files = request.files.len();
    let mut converted_count = 0;
    let mut failed_count = 0;
    let mut output_files = Vec::new();

    for (index, input_path) in request.files.iter().enumerate() {
        let filename = std::path::Path::new(input_path)
            .file_name()
            .map(|f| f.to_string_lossy().to_string())
            .unwrap_or_else(|| "Unknown".to_string());

        // Emit starting progress
        let _ = window.emit(
            "conversion-progress",
            ProgressEvent {
                current_file: index + 1,
                total_files,
                filename: filename.clone(),
                progress_percent: 0.0,
                status: "Starting...".to_string(),
                output_path: None,
            },
        );

        let output_path = get_output_path(input_path);

        // Run FFmpeg conversion
        let result = run_ffmpeg_conversion(
            &window,
            input_path,
            &output_path,
            request.speed_multiplier,
            index + 1,
            total_files,
            &filename,
        )
        .await;

        match result {
            Ok(_) => {
                converted_count += 1;
                output_files.push(output_path.clone());

                // Emit completion progress
                let _ = window.emit(
                    "conversion-progress",
                    ProgressEvent {
                        current_file: index + 1,
                        total_files,
                        filename: filename.clone(),
                        progress_percent: 100.0,
                        status: "Completed".to_string(),
                        output_path: Some(output_path),
                    },
                );
            }
            Err(e) => {
                failed_count += 1;
                let _ = window.emit(
                    "conversion-progress",
                    ProgressEvent {
                        current_file: index + 1,
                        total_files,
                        filename: filename.clone(),
                        progress_percent: 0.0,
                        status: format!("Failed: {}", e),
                        output_path: None,
                    },
                );
            }
        }
    }

    if failed_count == 0 {
        Ok(ConversionResult {
            success: true,
            message: format!(
                "Successfully converted {} video{}!",
                converted_count,
                if converted_count == 1 { "" } else { "s" }
            ),
            converted_count,
            failed_count,
            output_files,
        })
    } else if converted_count > 0 {
        Ok(ConversionResult {
            success: true,
            message: format!(
                "Converted {} video{}, {} failed",
                converted_count,
                if converted_count == 1 { "" } else { "s" },
                failed_count
            ),
            converted_count,
            failed_count,
            output_files,
        })
    } else {
        Err("All conversions failed".to_string())
    }
}

/// Run FFmpeg to convert a single video
async fn run_ffmpeg_conversion(
    window: &Window,
    input_path: &str,
    output_path: &str,
    speed_multiplier: u32,
    current_file: usize,
    total_files: usize,
    filename: &str,
) -> Result<(), String> {
    // Get video info for progress calculation
    let info = get_info(input_path);
    if !info.valid {
        return Err(info.error.unwrap_or_else(|| "Invalid video".to_string()));
    }

    // Calculate PTS (presentation timestamp) divisor for speed
    // To speed up by Nx, we use setpts=PTS/N
    let pts_divisor = speed_multiplier as f64;

    // Build FFmpeg command
    // Using setpts filter to change playback speed
    // For audio, we use atempo which only supports 0.5-2.0, so we chain multiple
    let mut args = vec![
        "-y".to_string(),           // Overwrite output
        "-i".to_string(),           // Input file
        input_path.to_string(),
        "-progress".to_string(),    // Output progress info
        "pipe:1".to_string(),
        "-filter_complex".to_string(),
        format!("[0:v]setpts=PTS/{:.2}[v]", pts_divisor),
        "-map".to_string(),
        "[v]".to_string(),
        "-an".to_string(),          // Remove audio (timelapse typically has no audio)
        "-c:v".to_string(),
        "libx264".to_string(),
        "-preset".to_string(),
        "fast".to_string(),
        "-crf".to_string(),
        "23".to_string(),
        output_path.to_string(),
    ];

    let mut child = Command::new("ffmpeg")
        .args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start FFmpeg: {}. Please ensure FFmpeg is installed.", e))?;

    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let reader = BufReader::new(stdout);

    // Track progress from FFmpeg output
    let duration_us = (info.duration_secs * 1_000_000.0) as u64;
    let window_clone = window.clone();
    let filename_clone = filename.to_string();

    // Parse FFmpeg progress output
    for line in reader.lines() {
        if let Ok(line) = line {
            if line.starts_with("out_time_us=") {
                if let Ok(current_us) = line.replace("out_time_us=", "").parse::<u64>() {
                    // Adjust for speed multiplier (output time is compressed)
                    let source_time_us = current_us * speed_multiplier as u64;
                    let progress = (source_time_us as f64 / duration_us as f64 * 100.0).min(99.0);

                    let _ = window_clone.emit(
                        "conversion-progress",
                        ProgressEvent {
                            current_file,
                            total_files,
                            filename: filename_clone.clone(),
                            progress_percent: progress,
                            status: "Converting...".to_string(),
                            output_path: None,
                        },
                    );
                }
            }
        }
    }

    // Wait for FFmpeg to complete
    let status = child.wait().map_err(|e| format!("FFmpeg process error: {}", e))?;

    if status.success() {
        Ok(())
    } else {
        Err("FFmpeg conversion failed".to_string())
    }
}
