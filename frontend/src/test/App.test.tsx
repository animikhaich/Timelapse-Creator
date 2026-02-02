import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { invoke } from '@tauri-apps/api/core';

// Type the mock
const mockInvoke = invoke as ReturnType<typeof vi.fn>;

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the header with title', () => {
    render(<App />);
    expect(screen.getByText('Timelapse')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<App />);
    expect(screen.getByText('Cinematic speed for your storytelling')).toBeInTheDocument();
  });

  it('renders the Import Videos button', () => {
    render(<App />);
    expect(screen.getByText('Import Videos')).toBeInTheDocument();
  });

  it('renders the Generate button', () => {
    render(<App />);
    expect(screen.getByText('Generate')).toBeInTheDocument();
  });

  it('renders the speed dropdown with default option', () => {
    render(<App />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('0');
  });

  it('renders all speed options', () => {
    render(<App />);
    const options = screen.getAllByRole('option');
    // 10 options: Select speed... + 9 speed values
    expect(options.length).toBe(10);
  });

  it('has correct speed multiplier values', () => {
    render(<App />);
    const expectedValues = ['0', '2', '5', '10', '25', '50', '100', '250', '500', '1000'];
    const options = screen.getAllByRole('option');
    options.forEach((option, index) => {
      expect(option).toHaveValue(expectedValues[index]);
    });
  });

  it('Generate button is disabled initially (no files selected)', () => {
    render(<App />);
    const generateBtn = screen.getByText('Generate').closest('button');
    expect(generateBtn).toBeDisabled();
  });

  it('allows speed selection change', () => {
    render(<App />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '10' } });
    expect(select).toHaveValue('10');
  });

  it('calls select_videos when Import Videos button is clicked', async () => {
    mockInvoke.mockResolvedValueOnce({ files: [], count: 0 });
    
    render(<App />);
    const selectBtn = screen.getByText('Import Videos');
    fireEvent.click(selectBtn);
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('select_videos');
    });
  });

  it('updates UI after selecting files', async () => {
    const mockFiles = ['/path/to/video.mp4'];
    const mockVideoInfo = [{
      path: '/path/to/video.mp4',
      filename: 'video.mp4',
      duration_secs: 120,
      width: 1920,
      height: 1080,
      fps: 30,
      total_frames: 3600,
      valid: true,
    }];

    mockInvoke
      .mockResolvedValueOnce({ files: mockFiles, count: 1 })
      .mockResolvedValueOnce(mockVideoInfo);
    
    render(<App />);
    const selectBtn = screen.getByText('Import Videos');
    fireEvent.click(selectBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Queue (1)')).toBeInTheDocument();
      expect(screen.getByText('video.mp4')).toBeInTheDocument();
    });
  });

  it('enables Generate button when files are selected and speed is chosen', async () => {
    const mockFiles = ['/path/to/video.mp4'];
    const mockVideoInfo = [{
      path: '/path/to/video.mp4',
      filename: 'video.mp4',
      duration_secs: 120,
      width: 1920,
      height: 1080,
      fps: 30,
      total_frames: 3600,
      valid: true,
    }];

    mockInvoke
      .mockResolvedValueOnce({ files: mockFiles, count: 1 })
      .mockResolvedValueOnce(mockVideoInfo);
    
    render(<App />);
    
    // Select files
    const selectBtn = screen.getByText('Import Videos');
    fireEvent.click(selectBtn);
    
    await waitFor(() => {
      expect(screen.getByText('video.mp4')).toBeInTheDocument();
    });
    
    // Select speed
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '10' } });
    
    // Check that Generate button is now enabled
    const generateBtn = screen.getByText('Generate').closest('button');
    expect(generateBtn).not.toBeDisabled();
  });
});

describe('Duration Formatting', () => {
  it('formats duration correctly', async () => {
    const mockFiles = ['/path/to/video.mp4'];
    const mockVideoInfo = [{
      path: '/path/to/video.mp4',
      filename: 'video.mp4',
      duration_secs: 125, // 2:05
      width: 1920,
      height: 1080,
      fps: 30,
      total_frames: 3750,
      valid: true,
    }];

    mockInvoke
      .mockResolvedValueOnce({ files: mockFiles, count: 1 })
      .mockResolvedValueOnce(mockVideoInfo);
    
    render(<App />);
    const selectBtn = screen.getByText('Import Videos');
    fireEvent.click(selectBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/2:05/)).toBeInTheDocument();
    });
  });
});
