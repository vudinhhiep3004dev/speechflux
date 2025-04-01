// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'; 

// Add any global Jest setup
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/mock-path',
    query: {},
  }),
  usePathname: () => '/mock-path',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    set: jest.fn(),
  }),
  headers: () => ({
    get: jest.fn(),
    has: jest.fn(),
  }),
}));

// Make console.error throw to catch rendering errors
const originalConsoleError = console.error;
console.error = (...args) => {
  // Keep the original behavior, but also throw to fail the test if it's a React error
  originalConsoleError(...args);
  
  // Check if this is a React-specific error by looking at the message
  const message = args.join(' ');
  if (
    message.includes('Warning: ') && 
    (message.includes('React') || message.includes('component'))
  ) {
    throw new Error(message);
  }
}; 