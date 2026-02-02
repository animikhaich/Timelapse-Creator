import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Moon, Sun, Upload, Play, FolderOpen, Film, Clock, CheckCircle, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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

const SPEED_OPTIONS = [
  { value: "2", label: "2× Faster" },
  { value: "5", label: "5× Faster" },
  { value: "10", label: "10× Faster" },
  { value: "25", label: "25× Faster" },
  { value: "50", label: "50× Faster" },
  { value: "100", label: "100× Faster" },
  { value: "250", label: "250× Faster" },
  { value: "500", label: "500× Faster" },
  { value: "1000", label: "1000× Faster" },
];

function App() {
  const [selectedFiles, setSelectedFiles] = useState<VideoInfo[]>([]);
  const [speedMultiplier, setSpeedMultiplier] = useState<string>("");
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [lastOutputDir, setLastOutputDir] = useState<string | null>(null);

  // Initialize theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const unlisten = listen<ProgressEvent>("conversion-progress", (event) => {
      setProgress(event.payload);
      if (event.payload.output_path) {
        setLastOutputDir(event.payload.output_path);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleSelectFiles = useCallback(async () => {
    try {
      const result = await invoke<SelectionResult>("select_videos");
      if (result.files.length > 0) {
        const infos = await invoke<VideoInfo[]>("get_video_info", {
          paths: result.files,
        });
        setSelectedFiles(infos.filter((info) => info.valid));
      }
    } catch (error) {
      console.error("Error selecting files:", error);
    }
  }, []);

  const handleConvert = useCallback(async () => {
    if (selectedFiles.length === 0 || !speedMultiplier) return;

    setIsConverting(true);
    setProgress(null);
    setLastOutputDir(null);

    try {
      const result = await invoke<ConversionResult>("convert_videos", {
        request: {
          files: selectedFiles.map((f) => f.path),
          speed_multiplier: parseInt(speedMultiplier),
        },
      });
      if (result.success && result.output_files.length > 0) {
        setLastOutputDir(result.output_files[0]);
      }
    } catch (error) {
      console.error("Conversion error:", error);
    } finally {
      setIsConverting(false);
    }
  }, [selectedFiles, speedMultiplier]);

  const openExplorer = async () => {
    if (lastOutputDir) {
      await invoke("open_file_explorer", { path: lastOutputDir });
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
            <Film className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Timelapse Creator</h1>
            <p className="text-xs text-muted-foreground">Cinematic speed for your storytelling</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDark(!isDark)}
          title="Toggle theme"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-6 max-w-5xl mx-auto w-full overflow-hidden">
        {/* Controls */}
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center flex-1">
              <Button 
                onClick={handleSelectFiles} 
                disabled={isConverting}
                className="gap-2 shadow-sm"
                size="lg"
              >
                <Upload className="h-4 w-4" />
                Import Videos
              </Button>
              
              <div className="w-[200px]">
                <Select 
                  value={speedMultiplier} 
                  onValueChange={setSpeedMultiplier}
                  disabled={isConverting}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select speed..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SPEED_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleConvert}
              disabled={isConverting || selectedFiles.length === 0 || !speedMultiplier}
              variant={isConverting ? "secondary" : "default"}
              className="gap-2 h-11 px-8"
            >
              {isConverting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  Generate Timelapse
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Queue / List */}
        <div className="flex-1 min-h-0 flex flex-col bg-card rounded-lg border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/30">
            <h2 className="font-semibold flex items-center gap-2">
              Video Queue
              <Badge variant="secondary" className="rounded-sm">
                {selectedFiles.length}
              </Badge>
            </h2>
            {selectedFiles.length > 0 && (
               <span className="text-xs text-muted-foreground">
                 Total Duration: {formatDuration(selectedFiles.reduce((acc, f) => acc + f.duration_secs, 0))}
               </span>
            )}
          </div>
          
          <ScrollArea className="flex-1 bg-background/50">
            {selectedFiles.length > 0 ? (
              <div className="flex flex-col">
                {selectedFiles.map((file, i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-4 px-6 py-3 hover:bg-muted/50 transition-colors border-b last:border-0"
                  >
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                      <Film className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="font-medium truncate text-sm" title={file.filename}>
                        {file.filename}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Fix: Display height instead of width */}
                        <Badge variant="outline" className="text-xs font-normal">
                           {file.height}p
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {file.width}×{file.height} • {file.fps}fps
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
                        <Clock className="h-3 w-3" />
                        {formatDuration(file.duration_secs)}
                      </div>
                    </div>
                    
                    <div className="shrink-0">
                      {file.valid ? (
                        <CheckCircle className="h-4 w-4 text-green-500/50" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive/50" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 opacity-50" />
                </div>
                <h3 className="font-semibold text-lg mb-1">No videos selected</h3>
                <p className="text-sm max-w-xs mx-auto">
                  Import videos to start creating your cinematic timelapse.
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </main>

      {/* Footer / Status */}
      <footer className="border-t bg-card px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          {isConverting && (
            <div className="flex items-center justify-between text-sm">
               <span className="text-muted-foreground">
                 Processing {progress?.current_file || 1} of {selectedFiles.length}
               </span>
               <span className="font-medium truncate max-w-xs" title={progress?.filename}>
                 {progress?.filename || "Working on it"}
               </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               {lastOutputDir && !isConverting && (
                 <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                   <CheckCircle className="h-4 w-4" />
                   Conversion complete
                 </div>
               )}
            </div>

            {lastOutputDir && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={openExplorer}
                className="gap-2"
              >
                <FolderOpen className="h-4 w-4" />
                Open Output Folder
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;