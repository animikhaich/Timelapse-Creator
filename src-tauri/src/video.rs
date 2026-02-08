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
        error: if width > 0 && height > 0 && duration_secs > 0.0 {
            None
        } else {
            Some(format!(
                "Invalid video metadata: {}",
                if width == 0 || height == 0 {
                    "missing resolution"
                } else {
                    "missing duration"
                }
            ))
        },
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
/// Returns an error if the output directory cannot be created
pub fn get_output_path(input_path: &str) -> Result<String, String> {
    let path = Path::new(input_path);
    let parent = path.parent().unwrap_or(Path::new("."));
    let stem = path
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "output".to_string());

    let output_dir = parent.join("outputs");

    // Create output directory if it doesn't exist
    std::fs::create_dir_all(&output_dir).map_err(|e| {
        format!(
            "Failed to create output directory '{}': {}",
            output_dir.display(),
            e
        )
    })?;

    Ok(output_dir
        .join(format!("{}_timelapse.mp4", stem))
        .to_string_lossy()
        .to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_supported_format_valid_formats() {
        // Test all supported formats in lowercase
        assert!(is_supported_format("video.mp4"));
        assert!(is_supported_format("video.webm"));
        assert!(is_supported_format("video.mpg"));
        assert!(is_supported_format("video.avi"));
        assert!(is_supported_format("video.mov"));
        assert!(is_supported_format("video.m4v"));
        assert!(is_supported_format("video.flv"));
        assert!(is_supported_format("video.mkv"));
        assert!(is_supported_format("video.wmv"));
        assert!(is_supported_format("video.3gp"));
    }

    #[test]
    fn test_is_supported_format_uppercase() {
        // Test uppercase extensions
        assert!(is_supported_format("video.MP4"));
        assert!(is_supported_format("video.AVI"));
        assert!(is_supported_format("video.MKV"));
    }

    #[test]
    fn test_is_supported_format_invalid_formats() {
        // Test unsupported formats
        assert!(!is_supported_format("video.txt"));
        assert!(!is_supported_format("video.pdf"));
        assert!(!is_supported_format("video.jpg"));
        assert!(!is_supported_format("video.png"));
        assert!(!is_supported_format("video.gif"));
        assert!(!is_supported_format("video"));
    }

    #[test]
    fn test_is_supported_format_with_path() {
        // Test with full paths
        assert!(is_supported_format("/home/user/videos/test.mp4"));
        assert!(is_supported_format("C:\\Users\\test\\video.avi"));
        assert!(is_supported_format("./relative/path/video.mkv"));
    }

    #[test]
    fn test_parse_fps_fraction() {
        assert_eq!(parse_fps("30/1"), 30.0);
        assert_eq!(parse_fps("60/1"), 60.0);
        // 30000/1001 is approximately 29.97
        let fps = parse_fps("30000/1001");
        assert!((fps - 29.97).abs() < 0.01);
    }

    #[test]
    fn test_parse_fps_decimal() {
        assert_eq!(parse_fps("30.0"), 30.0);
        assert_eq!(parse_fps("29.97"), 29.97);
        assert_eq!(parse_fps("60"), 60.0);
    }

    #[test]
    fn test_parse_fps_invalid() {
        // Invalid input should return default 30.0
        assert_eq!(parse_fps("invalid"), 30.0);
        assert_eq!(parse_fps(""), 30.0);
    }

    #[test]
    fn test_parse_fps_zero_denominator() {
        // Zero denominator should be handled gracefully
        let fps = parse_fps("30/0");
        assert_eq!(fps, 30.0); // Falls back to default
    }

    #[test]
    fn test_get_output_path_basic() {
        // Use /tmp for testing since we can write there
        let input = "/tmp/test.mp4";
        let output = get_output_path(input);
        assert!(output.is_ok());
        let output_path = output.unwrap();
        assert!(output_path.contains("outputs"));
        assert!(output_path.contains("test_timelapse.mp4"));
    }

    #[test]
    fn test_get_output_path_preserves_stem() {
        let input = "/tmp/my_video_file.avi";
        let output = get_output_path(input);
        assert!(output.is_ok());
        let output_path = output.unwrap();
        assert!(output_path.contains("my_video_file_timelapse.mp4"));
    }

    #[test]
    fn test_video_info_structure() {
        let info = VideoInfo {
            path: "/test/video.mp4".to_string(),
            filename: "video.mp4".to_string(),
            duration_secs: 120.5,
            width: 1920,
            height: 1080,
            fps: 30.0,
            total_frames: 3615,
            valid: true,
            error: None,
        };

        assert_eq!(info.path, "/test/video.mp4");
        assert_eq!(info.filename, "video.mp4");
        assert_eq!(info.duration_secs, 120.5);
        assert_eq!(info.width, 1920);
        assert_eq!(info.height, 1080);
        assert_eq!(info.fps, 30.0);
        assert!(info.valid);
        assert!(info.error.is_none());
    }

    #[test]
    fn test_video_info_invalid() {
        let info = VideoInfo {
            path: "/test/invalid.mp4".to_string(),
            filename: "invalid.mp4".to_string(),
            duration_secs: 0.0,
            width: 0,
            height: 0,
            fps: 0.0,
            total_frames: 0,
            valid: false,
            error: Some("Test error".to_string()),
        };

        assert!(!info.valid);
        assert!(info.error.is_some());
        assert_eq!(info.error.unwrap(), "Test error");
    }

    #[test]
    fn test_supported_formats_count() {
        // Ensure we have 10 supported formats
        assert_eq!(SUPPORTED_FORMATS.len(), 10);
    }

    #[test]
    fn test_supported_formats_contains_common_formats() {
        assert!(SUPPORTED_FORMATS.contains(&"mp4"));
        assert!(SUPPORTED_FORMATS.contains(&"avi"));
        assert!(SUPPORTED_FORMATS.contains(&"mkv"));
        assert!(SUPPORTED_FORMATS.contains(&"mov"));
    }

    #[test]
    fn test_parse_fps_multiple_slashes() {
        // Should fall back to 30.0 for malformed fraction
        assert_eq!(parse_fps("30/1/2"), 30.0);
    }

    #[test]
    fn test_is_supported_format_no_extension() {
        assert!(!is_supported_format("video"));
        assert!(!is_supported_format("/path/to/video"));
    }

    #[test]
    fn test_is_supported_format_double_extension() {
        // Should check the last extension
        assert!(is_supported_format("archive.tar.mp4"));
        assert!(!is_supported_format("video.mp4.txt"));
    }

    #[test]
    fn test_get_output_path_unicode() {
        let input = "/tmp/vïdéo.mp4";
        let output = get_output_path(input);
        assert!(output.is_ok());
        let output_path = output.unwrap();
        assert!(output_path.contains("vïdéo_timelapse.mp4"));
    }

    #[test]
    fn test_get_output_path_spaces() {
        let input = "/tmp/my video file.mp4";
        let output = get_output_path(input);
        assert!(output.is_ok());
        let output_path = output.unwrap();
        assert!(output_path.contains("my video file_timelapse.mp4"));
    }

    #[test]
    fn test_parse_ffprobe_output_valid() {
        let json_str = r#"{
            "streams": [
                {
                    "codec_type": "video",
                    "width": 1920,
                    "height": 1080,
                    "r_frame_rate": "30/1"
                }
            ],
            "format": {
                "duration": "100.0"
            }
        }"#;
        let info = parse_ffprobe_output("/path/test.mp4", "test.mp4", json_str.as_bytes());
        assert!(info.valid);
        assert_eq!(info.width, 1920);
        assert_eq!(info.height, 1080);
        assert_eq!(info.fps, 30.0);
        assert_eq!(info.duration_secs, 100.0);
        assert_eq!(info.total_frames, 3000);
        assert!(info.error.is_none());
    }

    #[test]
    fn test_parse_ffprobe_output_invalid_json() {
        let json_str = "{ invalid json }";
        let info = parse_ffprobe_output("/path/test.mp4", "test.mp4", json_str.as_bytes());
        assert!(!info.valid);
        assert!(info.error.is_some());
        assert!(info.error.unwrap().contains("Failed to parse ffprobe output"));
    }

    #[test]
    fn test_parse_ffprobe_output_missing_video_stream() {
        let json_str = r#"{
            "streams": [
                {
                    "codec_type": "audio",
                    "r_frame_rate": "0/0"
                }
            ],
            "format": {
                "duration": "100.0"
            }
        }"#;
        let info = parse_ffprobe_output("/path/test.mp4", "test.mp4", json_str.as_bytes());
        assert!(!info.valid);
        assert!(info.error.is_some());
        assert!(info.error.unwrap().contains("missing resolution"));
    }

    #[test]
    fn test_parse_ffprobe_output_missing_duration() {
        let json_str = r#"{
            "streams": [
                {
                    "codec_type": "video",
                    "width": 1920,
                    "height": 1080,
                    "r_frame_rate": "30/1"
                }
            ],
            "format": {
                "duration": "invalid"
            }
        }"#;
        let info = parse_ffprobe_output("/path/test.mp4", "test.mp4", json_str.as_bytes());
        assert!(!info.valid);
        assert!(info.error.is_some());
        assert!(info.error.unwrap().contains("missing duration"));
    }
}
