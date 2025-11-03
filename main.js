import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegPath.path);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('select-videos', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Videos', extensions: ['mp4', 'webm', 'mpg', 'avi', 'mov', 'm4v', 'flv', 'mkv'] }
    ]
  });
  if (canceled) {
    return [];
  } else {
    return filePaths;
  }
});

ipcMain.handle('convert-videos', async (event, { videos, speed }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  let totalProgress = 0;
  const videoProgress = new Array(videos.length).fill(0);

  videos.forEach((video, index) => {
    const outputFileName = `timelapse-${path.basename(video)}`;
    const outputPath = path.join(path.dirname(video), outputFileName);

    ffmpeg(video)
      .setStartTime(0)
      .outputOptions(`-vf "setpts=PTS/${speed}"`)
      .on('progress', (progress) => {
        videoProgress[index] = progress.percent;
        totalProgress = videoProgress.reduce((a, b) => a + b, 0) / videos.length;
        win.webContents.send('conversion-progress', { totalProgress });
      })
      .on('end', () => {
        console.log(`Video ${index + 1} converted successfully`);
      })
      .on('error', (err) => {
        console.error(`Error converting video ${index + 1}:`, err);
      })
      .save(outputPath);
  });
});
