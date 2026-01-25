// Environment variables polyfill for browser
declare global {
  interface Window {
    process?: {
      env: Record<string, string | undefined>;
    };
  }
}

// Provide fallback for process.env in browser environment
if (typeof window !== 'undefined' && !window.process) {
  window.process = {
    env: {
      REACT_APP_API_URL: import.meta.env.VITE_API_URL || '/api',
    }
  };
}

export const env = {
  REACT_APP_API_URL: import.meta.env.VITE_API_URL || window.process?.env.REACT_APP_API_URL || '/api/v1',
};