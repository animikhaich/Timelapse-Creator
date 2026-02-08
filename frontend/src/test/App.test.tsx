import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  });

  it('Generate button is disabled initially (no files selected)', () => {
    render(<App />);
    const generateBtn = screen.getByText('Generate Timelapse').closest('button');
    expect(generateBtn).toBeDisabled();
  });

  it('calls select_videos when Import Videos button is clicked', async () => {
    const user = userEvent.setup();
    mockInvoke.mockResolvedValueOnce({ files: [], count: 0 });
    
    render(<App />);
    const selectBtn = screen.getByText('Import Videos');
    await user.click(selectBtn);
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('select_videos');
    });
  });

  it('updates UI after selecting files', async () => {
    const user = userEvent.setup();
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
    await user.click(selectBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Video Queue')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('video.mp4')).toBeInTheDocument();
    });
  });

  it('handles select_videos error gracefully', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockInvoke.mockRejectedValueOnce('Failed to select');

    render(<App />);
    const selectBtn = screen.getByText('Import Videos');
    await user.click(selectBtn);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error selecting files:', 'Failed to select');
    });

    consoleSpy.mockRestore();
  });

  it('shows no videos selected state', () => {
    render(<App />);
    expect(screen.getByText('No videos selected')).toBeInTheDocument();
    expect(screen.getByText('Import videos to start creating your cinematic timelapse.')).toBeInTheDocument();
  });

  it('enables Generate button when files and speed are selected', async () => {
    // Note: shadcn select is tricky to test with userEvent because of portals and pointer events
    // We will simulate the state updates if possible, or use specific selectors
    const user = userEvent.setup();
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

    // Select File
    await user.click(screen.getByText('Import Videos'));
    await waitFor(() => expect(screen.getByText('video.mp4')).toBeInTheDocument());

    // Select Speed (using fireEvent on hidden input or select mechanism)
    // shadcn select uses Radix UI.
    // We can try clicking the trigger and then the option.
    const trigger = screen.getByRole('combobox');
    await user.click(trigger); // Open dropdown

    // In JSDOM, we might not see the content unless we mock pointer events or use findBy
    // Let's assume the content is rendered
    const option = await screen.findByText('10× Faster');
    await user.click(option);

    const generateBtn = screen.getByText('Generate Timelapse').closest('button');
    expect(generateBtn).not.toBeDisabled();
  });

  it('handles conversion flow', async () => {
    const user = userEvent.setup();
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

    // Mock select files response
    mockInvoke
      .mockResolvedValueOnce({ files: ['path'], count: 1 })
      .mockResolvedValueOnce(mockVideoInfo);

    // Mock convert response (returns promise that resolves after progress)
    let resolveConversion: (value: any) => void;
    const conversionPromise = new Promise((resolve) => {
      resolveConversion = resolve;
    });
    mockInvoke.mockReturnValueOnce(conversionPromise);

    render(<App />);

    // Select File
    await user.click(screen.getByText('Import Videos'));
    await waitFor(() => expect(screen.getByText('video.mp4')).toBeInTheDocument());

    // Select Speed
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByText('10× Faster'));

    // Start Conversion
    const generateBtn = screen.getByText('Generate Timelapse');
    await user.click(generateBtn);

    expect(screen.getByText('Processing...')).toBeInTheDocument();

    // Simulate progress
    act(() => {
      (global as any).mockEmit('conversion-progress', {
        current_file: 1,
        total_files: 1,
        filename: 'video.mp4',
        status: 'Converting...',
        output_path: null
      });
    });

    expect(screen.getByText('Processing 1 of 1')).toBeInTheDocument();
    
    // Complete conversion
    act(() => {
      (global as any).mockEmit('conversion-progress', {
        current_file: 1,
        total_files: 1,
        filename: 'video.mp4',
        status: 'Completed',
        output_path: '/out/video.mp4'
      });
    });

    // Resolve the invoke promise
    (resolveConversion! as Function)({
      success: true,
      message: 'Done',
      converted_count: 1,
      failed_count: 0,
      output_files: ['/out/video.mp4']
    });

    await waitFor(() => {
        expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Conversion complete')).toBeInTheDocument();
  });

  it('toggles theme', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const themeBtn = screen.getByTitle('Toggle theme');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    
    await user.click(themeBtn);
    expect(document.documentElement.classList.contains('light')).toBe(true);
    
    await user.click(themeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
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
    // Just force update state by simulating load or mocking state directly would be hard
    // So we use the UI interaction
    const selectBtn = screen.getByText('Import Videos');
    fireEvent.click(selectBtn);
    
    await waitFor(() => {
      expect(screen.getAllByText(/2:05/)).toHaveLength(2); // Header + item
    });
  });
});
