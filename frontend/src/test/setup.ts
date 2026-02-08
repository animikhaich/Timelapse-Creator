import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Store event listeners
// We use a Map to store callbacks for each event name
const eventListeners = new Map<string, Array<(event: any) => void>>();

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn((event, callback) => {
    const listeners = eventListeners.get(event) || [];
    listeners.push(callback);
    eventListeners.set(event, listeners);

    // Return unlisten function
    return Promise.resolve(() => {
      const listeners = eventListeners.get(event) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    });
  }),
}));

// Helper to trigger events
// This allows tests to simulate backend events
(global as any).mockEmit = (event: string, payload: any) => {
  const listeners = eventListeners.get(event);
  if (listeners) {
    listeners.forEach((callback) => callback({ payload }));
  }
};

// Mock pointer events for Radix UI
window.PointerEvent = class PointerEvent extends Event {
  constructor(type: string, props: PointerEventInit = {}) {
    super(type, props);
  }
} as any;

window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
window.HTMLElement.prototype.hasPointerCapture = vi.fn();

// ResizeObserver mock
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Clear listeners between tests
beforeEach(() => {
  eventListeners.clear();
  vi.clearAllMocks();
});
