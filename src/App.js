import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Progress } from '@/components/ui/progress.jsx';

function App() {
  const [theme, setTheme] = useState('dark');
  const [progress, setProgress] = useState(0);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [speed, setSpeed] = useState(2);

  useEffect(() => {
    window.electron.ipcRenderer.on('conversion-progress', ({ totalProgress }) => {
      setProgress(totalProgress);
    });
  }, []);

  const handleSelectVideos = async () => {
    const filePaths = await window.electron.ipcRenderer.invoke('select-videos');
    setSelectedVideos(filePaths);
  };

  const handleConvertVideos = () => {
    window.electron.ipcRenderer.invoke('convert-videos', { videos: selectedVideos, speed });
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <div className={`h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Timelapse Creator</h1>
          <Button onClick={toggleTheme}>
            {theme === 'light' ? 'Dark' : 'Light'} Mode
          </Button>
        </div>

        <div className="flex items-center space-x-4 mb-4">
          <Button onClick={handleSelectVideos}>Select Videos</Button>
          <Select onValueChange={(value) => setSpeed(parseInt(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Choose Speed" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2x</SelectItem>
              <SelectItem value="5">5x</SelectItem>
              <SelectItem value="10">10x</SelectItem>
              <SelectItem value="20">20x</SelectItem>
              <SelectItem value="30">30x</SelectItem>
              <SelectItem value="50">50x</SelectItem>
              <SelectItem value="100">100x</SelectItem>
              <SelectItem value="200">200x</SelectItem>
              <SelectItem value="300">300x</SelectItem>
              <SelectItem value="500">500x</SelectItem>
              <SelectItem value="1000">1000x</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleConvertVideos}>Convert</Button>
        </div>

        <div>
          <Progress value={progress} />
          <p className="text-center mt-2">{progress.toFixed(2)}%</p>
        </div>
      </div>
    </div>
  );
}

export default App;
