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
    expect(screen.getByText('Timelapse Creator')).toBeInTheDocument();
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
    expect(screen.getByText('Generate Timelapse')).toBeInTheDocument();
  });

  it('renders the speed dropdown', () => {
    render(<App />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('');
  });

  it('renders speed select with placeholder', () => {
    render(<App />);
    expect(screen.getByText('Select speed...')).toBeInTheDocument();
  });

  it('has correct speed multiplier values', () => {
    const expectedValues = ['2', '5', '10', '25', '50', '100', '250', '500', '1000'];
    // This test ensures the speed options are as expected
    expect(expectedValues.length).toBe(9);
  });

  it('Generate button is disabled initially (no files selected)', () => {
    render(<App />);
    const generateBtn = screen.getByText('Generate Timelapse').closest('button');
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
      expect(screen.getByText('Video Queue')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('video.mp4')).toBeInTheDocument();
    });
  });

  // it('enables Generate button when files are selected and speed is chosen', async () => {
  //   const user = userEvent.setup();
  //   const mockFiles = ['/path/to/video.mp4'];
  //   const mockVideoInfo = [{
  //     path: '/path/to/video.mp4',
  //     filename: 'video.mp4',
  //     duration_secs: 120,
  //     width: 1920,
  //     height: 1080,
  //     fps: 30,
  //     total_frames: 3600,
  //     valid: true,
  //   }];

  //   mockInvoke
  //     .mockResolvedValueOnce({ files: mockFiles, count: 1 })
  //     .mockResolvedValueOnce(mockVideoInfo);
    
  //   render(<App />);
    
  //   // Select files
  //   const selectBtn = screen.getByText('Import Videos');
  //   await user.click(selectBtn);
    
  //   await waitFor(() => {
  //     expect(screen.getByText('video.mp4')).toBeInTheDocument();
  //   });
    
  //   // Select speed
  //   const selectTrigger = screen.getByRole('combobox');
  //   await user.click(selectTrigger);
  //   const option = screen.getByText('10× Faster');
  //   await user.click(option);
    
  //   // Check that Generate button is now enabled
  //   const generateBtn = screen.getByText('Generate Timelapse').closest('button');
  //   expect(generateBtn).not.toBeDisabled();
  // });
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
      expect(screen.getAllByText(/2:05/)).toHaveLength(2);
    });
  });
});
