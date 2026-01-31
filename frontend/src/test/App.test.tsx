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
    expect(screen.getByText('Create beautiful timelapses from your videos')).toBeInTheDocument();
  });

  it('renders the Select Videos button', () => {
    render(<App />);
    expect(screen.getByText('Select Videos')).toBeInTheDocument();
  });

  it('renders the Convert button', () => {
    render(<App />);
    expect(screen.getByText('Convert')).toBeInTheDocument();
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
    // 12 options: Choose Speed + 11 speed values (2x to 1000x)
    expect(options.length).toBe(12);
  });

  it('has correct speed multiplier values', () => {
    render(<App />);
    const expectedValues = ['0', '2', '5', '10', '20', '30', '50', '100', '200', '300', '500', '1000'];
    const options = screen.getAllByRole('option');
    options.forEach((option, index) => {
      expect(option).toHaveValue(expectedValues[index]);
    });
  });

  it('shows Ready! status initially', () => {
    render(<App />);
    expect(screen.getByText('Ready!')).toBeInTheDocument();
  });

  it('Convert button is disabled initially (no files selected)', () => {
    render(<App />);
    const convertBtn = screen.getByText('Convert').closest('button');
    expect(convertBtn).toBeDisabled();
  });

  it('allows speed selection change', () => {
    render(<App />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '10' } });
    expect(select).toHaveValue('10');
  });

  it('calls select_videos when Select Videos button is clicked', async () => {
    mockInvoke.mockResolvedValueOnce({ files: [], count: 0 });
    
    render(<App />);
    const selectBtn = screen.getByText('Select Videos');
    fireEvent.click(selectBtn);
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('select_videos');
    });
  });

  it('updates status after selecting files', async () => {
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
    const selectBtn = screen.getByText('Select Videos');
    fireEvent.click(selectBtn);
    
    await waitFor(() => {
      expect(screen.getByText('1 video(s) selected')).toBeInTheDocument();
    });
  });

  it('displays selected video information', async () => {
    const mockFiles = ['/path/to/video.mp4'];
    const mockVideoInfo = [{
      path: '/path/to/video.mp4',
      filename: 'my_video.mp4',
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
    const selectBtn = screen.getByText('Select Videos');
    fireEvent.click(selectBtn);
    
    await waitFor(() => {
      expect(screen.getByText('my_video.mp4')).toBeInTheDocument();
      expect(screen.getByText(/1920×1080/)).toBeInTheDocument();
      expect(screen.getByText(/30.0 fps/)).toBeInTheDocument();
    });
  });

  it('enables Convert button when files are selected and speed is chosen', async () => {
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
    const selectBtn = screen.getByText('Select Videos');
    fireEvent.click(selectBtn);
    
    await waitFor(() => {
      expect(screen.getByText('video.mp4')).toBeInTheDocument();
    });
    
    // Select speed
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '10' } });
    
    // Check that Convert button is now enabled
    const convertBtn = screen.getByText('Convert').closest('button');
    expect(convertBtn).not.toBeDisabled();
  });

  it('shows error when trying to convert without selecting files', async () => {
    render(<App />);
    
    // Select speed first
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '10' } });
    
    // Convert button should still be disabled
    const convertBtn = screen.getByText('Convert').closest('button');
    expect(convertBtn).toBeDisabled();
  });
});

describe('Speed Options', () => {
  it('includes all expected speed multipliers', () => {
    render(<App />);
    
    const expectedSpeeds = [
      'Choose Speed',
      '2× Speed',
      '5× Speed',
      '10× Speed',
      '20× Speed',
      '30× Speed',
      '50× Speed',
      '100× Speed',
      '200× Speed',
      '300× Speed',
      '500× Speed',
      '1000× Speed',
    ];
    
    expectedSpeeds.forEach(speed => {
      expect(screen.getByText(speed)).toBeInTheDocument();
    });
  });
});

describe('Duration Formatting', () => {
  it('formats duration correctly for videos under 1 hour', async () => {
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
    const selectBtn = screen.getByText('Select Videos');
    fireEvent.click(selectBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/2:05/)).toBeInTheDocument();
    });
  });

  it('formats duration correctly for videos over 1 hour', async () => {
    const mockFiles = ['/path/to/video.mp4'];
    const mockVideoInfo = [{
      path: '/path/to/video.mp4',
      filename: 'video.mp4',
      duration_secs: 3725, // 1:02:05
      width: 1920,
      height: 1080,
      fps: 30,
      total_frames: 111750,
      valid: true,
    }];

    mockInvoke
      .mockResolvedValueOnce({ files: mockFiles, count: 1 })
      .mockResolvedValueOnce(mockVideoInfo);
    
    render(<App />);
    const selectBtn = screen.getByText('Select Videos');
    fireEvent.click(selectBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/1:02:05/)).toBeInTheDocument();
    });
  });
});

describe('Batch Processing', () => {
  it('displays multiple selected files', async () => {
    const mockFiles = ['/path/to/video1.mp4', '/path/to/video2.mp4'];
    const mockVideoInfo = [
      {
        path: '/path/to/video1.mp4',
        filename: 'video1.mp4',
        duration_secs: 60,
        width: 1920,
        height: 1080,
        fps: 30,
        total_frames: 1800,
        valid: true,
      },
      {
        path: '/path/to/video2.mp4',
        filename: 'video2.mp4',
        duration_secs: 120,
        width: 1280,
        height: 720,
        fps: 24,
        total_frames: 2880,
        valid: true,
      },
    ];

    mockInvoke
      .mockResolvedValueOnce({ files: mockFiles, count: 2 })
      .mockResolvedValueOnce(mockVideoInfo);
    
    render(<App />);
    const selectBtn = screen.getByText('Select Videos');
    fireEvent.click(selectBtn);
    
    await waitFor(() => {
      expect(screen.getByText('video1.mp4')).toBeInTheDocument();
      expect(screen.getByText('video2.mp4')).toBeInTheDocument();
      expect(screen.getByText('2 video(s) selected')).toBeInTheDocument();
      expect(screen.getByText('Selected Videos (2)')).toBeInTheDocument();
    });
  });

  it('excludes invalid files and shows warning', async () => {
    const mockFiles = ['/path/to/video1.mp4', '/path/to/invalid.mp4'];
    const mockVideoInfo = [
      {
        path: '/path/to/video1.mp4',
        filename: 'video1.mp4',
        duration_secs: 60,
        width: 1920,
        height: 1080,
        fps: 30,
        total_frames: 1800,
        valid: true,
      },
      {
        path: '/path/to/invalid.mp4',
        filename: 'invalid.mp4',
        duration_secs: 0,
        width: 0,
        height: 0,
        fps: 0,
        total_frames: 0,
        valid: false,
        error: 'Cannot read file',
      },
    ];

    mockInvoke
      .mockResolvedValueOnce({ files: mockFiles, count: 2 })
      .mockResolvedValueOnce(mockVideoInfo);
    
    render(<App />);
    const selectBtn = screen.getByText('Select Videos');
    fireEvent.click(selectBtn);
    
    await waitFor(() => {
      // Only valid file should be shown
      expect(screen.getByText('video1.mp4')).toBeInTheDocument();
      expect(screen.queryByText('invalid.mp4')).not.toBeInTheDocument();
      // Warning should be displayed
      expect(screen.getByText(/1 file\(s\) could not be read/)).toBeInTheDocument();
    });
  });
});
