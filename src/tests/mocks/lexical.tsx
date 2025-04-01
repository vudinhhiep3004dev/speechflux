import React from 'react';

// Mock Lexical components
export const LexicalComposer = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="lexical-composer">{children}</div>
);

export const RichTextPlugin = () => <div data-testid="rich-text-plugin" />;
export const ContentEditable = () => <div data-testid="content-editable" />;
export const HistoryPlugin = () => <div data-testid="history-plugin" />;
export const AutoFocusPlugin = () => <div data-testid="autofocus-plugin" />;
export const LexicalErrorBoundary = () => <div data-testid="error-boundary" />;
export const OnChangePlugin = () => <div data-testid="on-change-plugin" />; 