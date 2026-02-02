use crate::video::{get_info, get_output_path, is_supported_format, VideoInfo, SUPPORTED_FORMATS};
use serde::{Deserialize, Serialize};
use std::process::Stdio;
use tauri::{Emitter, Window};
use tauri_plugin_dialog::DialogExt;
use tokio::process::Command as TokioCommand;

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
    pub status: String,
    pub output_path: Option<String>,
}

/// Open file dialog to select videos
#[tauri::command]
pub async fn select_videos(window: Window) -> Result<SelectionResult, String> {
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

/// Open file explorer at the specified path
#[tauri::command]
pub async fn open_file_explorer(path: String) -> Result<(), String> {
    let path = std::path::Path::new(&path);
    let folder = if path.is_dir() {
        path
    } else {
        path.parent().unwrap_or(std::path::Path::new("."))
    };

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(folder)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(folder)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(folder)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
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
                status: "Starting...".to_string(),
                output_path: None,
            },
        );

        let output_path = match get_output_path(input_path) {
            Ok(path) => path,
            Err(e) => {
                failed_count += 1;
                let _ = window.emit(
                    "conversion-progress",
                    ProgressEvent {
                        current_file: index + 1,
                        total_files,
                        filename: filename.clone(),
                        status: format!("Failed: {}", e),
                        output_path: None,
                    },
                );
                continue;
            }
        };

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
    _window: &Window,
    input_path: &str,
    output_path: &str,
    speed_multiplier: u32,
    _current_file: usize,
    _total_files: usize,
    _filename: &str,
) -> Result<(), String> {
    // Validate speed multiplier (must be between 2 and 1000 to match UI options)
    if speed_multiplier < 2 {
        return Err("Speed multiplier must be at least 2".to_string());
    }
    if speed_multiplier > 1000 {
        return Err("Speed multiplier cannot exceed 1000".to_string());
    }

    // Get video info for progress calculation
    let info = get_info(input_path);
    if !info.valid {
        return Err(info.error.unwrap_or_else(|| "Invalid video".to_string()));
    }

    // Calculate PTS (presentation timestamp) divisor for speed
    // To speed up by Nx, we use setpts=PTS/N
    let pts_divisor = speed_multiplier as f64;

    // Build FFmpeg command with reduced log verbosity
    // Using setpts filter to change playback speed
    let args = vec![
        "-y".to_string(),              // Overwrite output
        "-loglevel".to_string(),       // Reduce log verbosity
        "error".to_string(),
        "-i".to_string(),              // Input file
        input_path.to_string(),
        "-filter_complex".to_string(),
        format!("[0:v]setpts=PTS/{:.2}[v]", pts_divisor),
        "-map".to_string(),
        "[v]".to_string(),
        "-an".to_string(),             // Remove audio (timelapse typically has no audio)
        "-c:v".to_string(),
        "libx264".to_string(),
        "-preset".to_string(),
        "fast".to_string(),
        "-crf".to_string(),
        "23".to_string(),
        output_path.to_string(),
    ];

    let status = TokioCommand::new("ffmpeg")
        .args(&args)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| {
            format!(
                "Failed to start FFmpeg: {}. Please ensure FFmpeg is installed.",
                e
            )
        })?
        .wait()
        .await
        .map_err(|e| format!("FFmpeg process error: {}", e))?;

    if status.success() {
        Ok(())
    } else {
        Err("FFmpeg conversion failed".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_selection_result_empty() {
        let result = SelectionResult {
            files: vec![],
            count: 0,
        };
        assert_eq!(result.count, 0);
        assert!(result.files.is_empty());
    }

    #[test]
    fn test_selection_result_with_files() {
        let result = SelectionResult {
            files: vec![
                "/path/to/video1.mp4".to_string(),
                "/path/to/video2.avi".to_string(),
            ],
            count: 2,
        };
        assert_eq!(result.count, 2);
        assert_eq!(result.files.len(), 2);
    }

    #[test]
    fn test_conversion_request_structure() {
        let request = ConversionRequest {
            files: vec!["/test/video.mp4".to_string()],
            speed_multiplier: 10,
        };
        assert_eq!(request.files.len(), 1);
        assert_eq!(request.speed_multiplier, 10);
    }

    #[test]
    fn test_conversion_request_various_speeds() {
        for speed in [2, 5, 10, 20, 30, 50, 100, 200, 300, 500, 1000] {
            let request = ConversionRequest {
                files: vec![],
                speed_multiplier: speed,
            };
            assert_eq!(request.speed_multiplier, speed);
        }
    }

    #[test]
    fn test_conversion_result_success() {
        let result = ConversionResult {
            success: true,
            message: "Successfully converted 2 videos!".to_string(),
            converted_count: 2,
            failed_count: 0,
            output_files: vec![
                "/output/video1_timelapse.mp4".to_string(),
                "/output/video2_timelapse.mp4".to_string(),
            ],
        };
        assert!(result.success);
        assert_eq!(result.converted_count, 2);
        assert_eq!(result.failed_count, 0);
        assert_eq!(result.output_files.len(), 2);
    }

    #[test]
    fn test_conversion_result_partial_failure() {
        let result = ConversionResult {
            success: true,
            message: "Converted 1 video, 1 failed".to_string(),
            converted_count: 1,
            failed_count: 1,
            output_files: vec!["/output/video1_timelapse.mp4".to_string()],
        };
        assert!(result.success);
        assert_eq!(result.converted_count, 1);
        assert_eq!(result.failed_count, 1);
    }

    #[test]
    fn test_progress_event_structure() {
        let event = ProgressEvent {
            current_file: 1,
            total_files: 3,
            filename: "video.mp4".to_string(),
            status: "Converting...".to_string(),
            output_path: None,
        };
        assert_eq!(event.current_file, 1);
        assert_eq!(event.total_files, 3);
        assert!(event.output_path.is_none());
    }

    #[test]
    fn test_progress_event_completed() {
        let event = ProgressEvent {
            current_file: 1,
            total_files: 1,
            filename: "video.mp4".to_string(),
            status: "Completed".to_string(),
            output_path: Some("/output/video_timelapse.mp4".to_string()),
        };
        assert!(event.output_path.is_some());
    }

    #[test]
    fn test_progress_event_serialization() {
        let event = ProgressEvent {
            current_file: 1,
            total_files: 2,
            filename: "test.mp4".to_string(),
            status: "Converting...".to_string(),
            output_path: None,
        };

        // Test that it can be serialized to JSON
        let json = serde_json::to_string(&event);
        assert!(json.is_ok());

        // Test that it contains expected fields
        let json_str = json.unwrap();
        assert!(json_str.contains("current_file"));
        assert!(json_str.contains("total_files"));
        assert!(json_str.contains("filename"));
    }

    #[test]
    fn test_selection_result_serialization() {
        let result = SelectionResult {
            files: vec!["test.mp4".to_string()],
            count: 1,
        };

        let json = serde_json::to_string(&result);
        assert!(json.is_ok());
    }

    #[test]
    fn test_conversion_result_serialization() {
        let result = ConversionResult {
            success: true,
            message: "Done".to_string(),
            converted_count: 1,
            failed_count: 0,
            output_files: vec!["output.mp4".to_string()],
        };

        let json = serde_json::to_string(&result);
        assert!(json.is_ok());
    }
}
