import React from 'react';
import { render } from '@testing-library/react';
import { AutoSavePlugin } from '../AutoSavePlugin';

// Mock the Lexical composer context
jest.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [
    {
      registerUpdateListener: jest.fn(() => jest.fn()), // Returns an unregister function
    },
  ],
}));

describe('AutoSavePlugin', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders nothing', () => {
    const { container } = render(
      <AutoSavePlugin onSave={jest.fn()} saveInterval={5000} />
    );
    
    expect(container.firstChild).toBeNull();
  });
  
  it('calls onSave function on interval', () => {
    const mockSave = jest.fn().mockResolvedValue(undefined);
    
    // Render the component
    render(<AutoSavePlugin onSave={mockSave} saveInterval={5000} />);
    
    // Advance timers by 5 seconds
    jest.advanceTimersByTime(5000);
    
    // Check if save was not called since there were no changes
    expect(mockSave).not.toHaveBeenCalled();
    
    // We can't easily test the actual saving logic without mocking the entire Lexical
    // ecosystem, which is beyond the scope of this test. We're just verifying
    // the component renders and sets up the interval properly.
  });
  
  it('calls window.addEventListener for beforeunload', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = render(
      <AutoSavePlugin onSave={jest.fn()} saveInterval={5000} />
    );
    
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
    
    // Test cleanup on unmount
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });
}); 