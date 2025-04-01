'use client';

import React, { useEffect, useState } from 'react';
import {
  LexicalComposer,
  RichTextPlugin,
  ContentEditable,
  HistoryPlugin,
  AutoFocusPlugin,
  LexicalErrorBoundary,
  OnChangePlugin,
  LinkPlugin,
  ListPlugin
} from './lexical-shim';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { AutoSavePlugin } from './plugins/AutoSavePlugin';
import { ToolbarPlugin } from './plugins/ToolbarPlugin';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { EditorState } from 'lexical';

export interface TranscriptEditorProps {
  initialContent?: string;
  transcriptId: string;
  readOnly?: boolean;
  onChange?: (editorState: EditorState) => void;
  onSave?: (content: string) => Promise<void>;
}

export function TranscriptEditor({
  initialContent = '',
  transcriptId,
  readOnly = false,
  onChange,
  onSave,
}: TranscriptEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const { toast } = useToast();

  // Editor configuration
  const initialConfig = {
    namespace: `transcript-editor-${transcriptId}`,
    theme: {
      root: 'p-4 border rounded-md min-h-[200px] focus:outline-none',
      link: 'cursor-pointer text-blue-500 underline',
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
        underlineStrikethrough: 'underline line-through',
      },
      paragraph: 'my-2',
      heading: {
        h1: 'text-2xl font-bold my-3',
        h2: 'text-xl font-bold my-2',
        h3: 'text-lg font-bold my-2',
      },
    },
    onError: (error: Error) => {
      console.error('Lexical Editor Error:', error);
      toast({
        title: 'Editor Error',
        description: 'An error occurred in the editor. Please try again.',
        variant: 'destructive',
      });
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListItemNode,
      ListNode,
      LinkNode,
      TableNode,
      TableCellNode,
      TableRowNode,
    ],
    editorState: initialContent,
    editable: !readOnly,
  };

  const handleSave = async () => {
    if (!onSave || !editorState) return;
    
    try {
      setIsSaving(true);
      
      // Serialize editor state to JSON
      const editorStateJSON = editorState.toJSON();
      await onSave(JSON.stringify(editorStateJSON));
      
      toast({
        title: 'Saved',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving transcript:', error);
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="transcript-editor">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="editor-container">
          {!readOnly && (
            <ToolbarPlugin />
          )}
          
          <div className="editor-inner">
            <RichTextPlugin
              contentEditable={<ContentEditable className="editor-input" />}
              placeholder={<div className="editor-placeholder">Start editing transcript...</div>}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            {!readOnly && <AutoFocusPlugin />}
            <OnChangePlugin onChange={editorState => {
              setEditorState(editorState);
              if (onChange) onChange(editorState);
            }} />
            {!readOnly && onSave && (
              <AutoSavePlugin 
                onSave={handleSave}
                saveInterval={30000} // 30 seconds
              />
            )}
          </div>
        </div>
      </LexicalComposer>
      
      {!readOnly && onSave && (
        <div className="flex justify-end mt-4">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
} 