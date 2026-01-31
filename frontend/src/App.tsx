import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

// Type definitions
interface VideoInfo {
  path: string;
  filename: string;
  duration_secs: number;
  width: number;
  height: number;
  fps: number;
  total_frames: number;
  valid: boolean;
  error?: string;
}

interface SelectionResult {
  files: string[];
  count: number;
}

interface ProgressEvent {
  current_file: number;
  total_files: number;
  filename: string;
  progress_percent: number;
  status: string;
  output_path?: string;
}

interface ConversionResult {
  success: boolean;
  message: string;
  converted_count: number;
  failed_count: number;
  output_files: string[];
}

// Speed multiplier options
const SPEED_OPTIONS = [
  { value: 0, label: "Choose Speed" },
  { value: 2, label: "2× Speed" },
  { value: 5, label: "5× Speed" },
  { value: 10, label: "10× Speed" },
  { value: 20, label: "20× Speed" },
  { value: 30, label: "30× Speed" },
  { value: 50, label: "50× Speed" },
  { value: 100, label: "100× Speed" },
  { value: 200, label: "200× Speed" },
  { value: 300, label: "300× Speed" },
  { value: 500, label: "500× Speed" },
  { value: 1000, label: "1000× Speed" },
];

function App() {
  const [selectedFiles, setSelectedFiles] = useState<VideoInfo[]>([]);
  const [speedMultiplier, setSpeedMultiplier] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [statusMessage, setStatusMessage] = useState("Ready!");
  const [resultMessage, setResultMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Listen for progress events from backend
  useEffect(() => {
    const unlisten = listen<ProgressEvent>("conversion-progress", (event) => {
      setProgress(event.payload);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Handle file selection
  const handleSelectFiles = useCallback(async () => {
    try {
      const result = await invoke<SelectionResult>("select_videos");
      if (result.files.length > 0) {
        // Get video info for each selected file
        const infos = await invoke<VideoInfo[]>("get_video_info", {
          paths: result.files,
        });

        const validFiles = infos.filter((info) => info.valid);
        const invalidCount = infos.length - validFiles.length;

        setSelectedFiles(validFiles);

        if (invalidCount > 0) {
          setResultMessage({
            type: "error",
            message: `${invalidCount} file(s) could not be read and were excluded.`,
          });
          setTimeout(() => setResultMessage(null), 3000);
        }

        setStatusMessage(
          validFiles.length > 0
            ? `${validFiles.length} video(s) selected`
            : "No valid videos selected"
        );
      }
    } catch (error) {
      console.error("Error selecting files:", error);
      setResultMessage({
        type: "error",
        message: "Failed to select files. Please try again.",
      });
    }
  }, []);

  // Handle conversion
  const handleConvert = useCallback(async () => {
    if (selectedFiles.length === 0) {
      setResultMessage({
        type: "error",
        message: 'Please select videos first by clicking "Select Videos"',
      });
      setTimeout(() => setResultMessage(null), 3000);
      return;
    }

    if (speedMultiplier === 0) {
      setResultMessage({
        type: "error",
        message: "Please select a speed multiplier from the dropdown",
      });
      setTimeout(() => setResultMessage(null), 3000);
      return;
    }

    setIsConverting(true);
    setProgress(null);
    setResultMessage(null);

    try {
      const result = await invoke<ConversionResult>("convert_videos", {
        request: {
          files: selectedFiles.map((f) => f.path),
          speed_multiplier: speedMultiplier,
        },
      });

      setResultMessage({
        type: result.success ? "success" : "error",
        message: result.message,
      });
    } catch (error) {
      console.error("Conversion error:", error);
      setResultMessage({
        type: "error",
        message: `Conversion failed: ${error}`,
      });
    } finally {
      setIsConverting(false);
      setProgress(null);
      setStatusMessage("Ready!");
    }
  }, [selectedFiles, speedMultiplier]);

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <h1>Timelapse Creator</h1>
        </div>
        <p className="subtitle">
          Create beautiful timelapses from your videos
        </p>
      </header>

      {/* Main Controls */}
      <section className="controls">
        <button
          className="btn btn-primary"
          onClick={handleSelectFiles}
          disabled={isConverting}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Select Videos
        </button>

        <select
          className="select"
          value={speedMultiplier}
          onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
          disabled={isConverting}
        >
          {SPEED_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          className="btn btn-convert"
          onClick={handleConvert}
          disabled={isConverting || selectedFiles.length === 0 || speedMultiplier === 0}
        >
          {isConverting ? (
            <>
              <div className="spinner" />
              Converting...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Convert
            </>
          )}
        </button>
      </section>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <section className="files-section">
          <h2>Selected Videos ({selectedFiles.length})</h2>
          <div className="files-list">
            {selectedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                    <line x1="7" y1="2" x2="7" y2="22" />
                    <line x1="17" y1="2" x2="17" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <line x1="2" y1="7" x2="7" y2="7" />
                    <line x1="2" y1="17" x2="7" y2="17" />
                    <line x1="17" y1="17" x2="22" y2="17" />
                    <line x1="17" y1="7" x2="22" y2="7" />
                  </svg>
                </div>
                <div className="file-details">
                  <span className="file-name">{file.filename}</span>
                  <span className="file-meta">
                    {file.width}×{file.height} • {formatDuration(file.duration_secs)} • {file.fps.toFixed(1)} fps
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Progress Section */}
      {(isConverting || progress) && (
        <section className="progress-section">
          <div className="progress-info">
            <span className="progress-status">
              {progress?.status || "Preparing..."}
            </span>
            {progress && (
              <span className="progress-detail">
                File {progress.current_file} of {progress.total_files}: {progress.filename}
              </span>
            )}
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${progress?.progress_percent || 0}%` }}
            />
          </div>
          <span className="progress-percent">
            {(progress?.progress_percent || 0).toFixed(1)}%
          </span>
        </section>
      )}

      {/* Status Bar */}
      <footer className="status-bar">
        <span className="status-text">{statusMessage}</span>
        {resultMessage && (
          <div className={`toast toast-${resultMessage.type}`}>
            {resultMessage.message}
          </div>
        )}
      </footer>
    </div>
  );
}

export default App;
