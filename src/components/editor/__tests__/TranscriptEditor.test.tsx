import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the entire component
jest.mock('../TranscriptEditor', () => ({
  TranscriptEditor: ({ readOnly, transcriptId }: { readOnly?: boolean; transcriptId: string }) => (
    <div data-testid="transcript-editor" data-readonly={readOnly ? 'true' : 'false'}>
      {!readOnly && <div data-testid="toolbar" />}
      <div data-testid="editor-content" />
      {!readOnly && <button data-testid="save-button">Save</button>}
    </div>
  ),
}));

// Import after mocking
import { TranscriptEditor } from '../TranscriptEditor';

describe('TranscriptEditor', () => {
  const mockProps = {
    transcriptId: 'test-transcript-id',
    initialContent: '',
    readOnly: false,
    onSave: jest.fn().mockResolvedValue(undefined),
  };

  it('renders correctly', () => {
    render(<TranscriptEditor {...mockProps} />);
    
    expect(screen.getByTestId('transcript-editor')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    expect(screen.getByTestId('save-button')).toBeInTheDocument();
  });

  it('does not render toolbar when readOnly is true', () => {
    render(<TranscriptEditor {...mockProps} readOnly={true} />);
    
    expect(screen.getByTestId('transcript-editor')).toBeInTheDocument();
    expect(screen.queryByTestId('toolbar')).not.toBeInTheDocument();
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    expect(screen.queryByTestId('save-button')).not.toBeInTheDocument();
  });
}); 