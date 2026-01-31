use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;

/// Supported video formats for timelapse conversion
pub const SUPPORTED_FORMATS: &[&str] = &[
    "mp4", "webm", "mpg", "avi", "mov", "m4v", "flv", "mkv", "wmv", "3gp",
];

/// Video information structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoInfo {
    pub path: String,
    pub filename: String,
    pub duration_secs: f64,
    pub width: u32,
    pub height: u32,
    pub fps: f64,
    pub total_frames: u64,
    pub valid: bool,
    pub error: Option<String>,
}

/// Conversion progress information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversionProgress {
    pub current_file: usize,
    pub total_files: usize,
    pub filename: String,
    pub progress_percent: f64,
    pub status: String,
}

/// Check if a file extension is a supported video format
pub fn is_supported_format(path: &str) -> bool {
    if let Some(ext) = Path::new(path).extension() {
        let ext_lower = ext.to_string_lossy().to_lowercase();
        SUPPORTED_FORMATS.contains(&ext_lower.as_str())
    } else {
        false
    }
}

/// Get video information using ffprobe
pub fn get_info(path: &str) -> VideoInfo {
    let filename = Path::new(path)
        .file_name()
        .map(|f| f.to_string_lossy().to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    // Run ffprobe to get video information
    let output = Command::new("ffprobe")
        .args([
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            path,
        ])
        .output();

    match output {
        Ok(output) => {
            if output.status.success() {
                parse_ffprobe_output(path, &filename, &output.stdout)
            } else {
                VideoInfo {
                    path: path.to_string(),
                    filename,
                    duration_secs: 0.0,
                    width: 0,
                    height: 0,
                    fps: 0.0,
                    total_frames: 0,
                    valid: false,
                    error: Some("FFprobe failed to analyze video".to_string()),
                }
            }
        }
        Err(e) => VideoInfo {
            path: path.to_string(),
            filename,
            duration_secs: 0.0,
            width: 0,
            height: 0,
            fps: 0.0,
            total_frames: 0,
            valid: false,
            error: Some(format!("Failed to run ffprobe: {}", e)),
        },
    }
}

fn parse_ffprobe_output(path: &str, filename: &str, stdout: &[u8]) -> VideoInfo {
    let json_str = String::from_utf8_lossy(stdout);
    let json: serde_json::Value = match serde_json::from_str(&json_str) {
        Ok(v) => v,
        Err(e) => {
            return VideoInfo {
                path: path.to_string(),
                filename: filename.to_string(),
                duration_secs: 0.0,
                width: 0,
                height: 0,
                fps: 0.0,
                total_frames: 0,
                valid: false,
                error: Some(format!("Failed to parse ffprobe output: {}", e)),
            }
        }
    };

    // Extract video stream information
    let streams = json["streams"].as_array();
    let format = &json["format"];

    let mut width = 0u32;
    let mut height = 0u32;
    let mut fps = 0.0f64;

    if let Some(streams) = streams {
        for stream in streams {
            if stream["codec_type"].as_str() == Some("video") {
                width = stream["width"].as_u64().unwrap_or(0) as u32;
                height = stream["height"].as_u64().unwrap_or(0) as u32;

                // Parse frame rate (can be "30/1" or "29.97")
                if let Some(fps_str) = stream["r_frame_rate"].as_str() {
                    fps = parse_fps(fps_str);
                }
                break;
            }
        }
    }

    // Extract duration
    let duration_secs = format["duration"]
        .as_str()
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(0.0);

    let total_frames = (duration_secs * fps).round() as u64;

    VideoInfo {
        path: path.to_string(),
        filename: filename.to_string(),
        duration_secs,
        width,
        height,
        fps,
        total_frames,
        valid: width > 0 && height > 0 && duration_secs > 0.0,
        error: None,
    }
}

/// Parse FPS from ffprobe format (e.g., "30/1" or "30000/1001")
fn parse_fps(fps_str: &str) -> f64 {
    if fps_str.contains('/') {
        let parts: Vec<&str> = fps_str.split('/').collect();
        if parts.len() == 2 {
            let num: f64 = parts[0].parse().unwrap_or(0.0);
            let den: f64 = parts[1].parse().unwrap_or(1.0);
            if den > 0.0 {
                return num / den;
            }
        }
    }
    fps_str.parse().unwrap_or(30.0)
}

/// Generate output path for converted video
pub fn get_output_path(input_path: &str) -> String {
    let path = Path::new(input_path);
    let parent = path.parent().unwrap_or(Path::new("."));
    let stem = path
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "output".to_string());

    let output_dir = parent.join("outputs");

    // Create output directory if it doesn't exist
    let _ = std::fs::create_dir_all(&output_dir);

    output_dir
        .join(format!("{}_timelapse.mp4", stem))
        .to_string_lossy()
        .to_string()
}
