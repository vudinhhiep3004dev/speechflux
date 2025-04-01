'use client';

import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

interface AutoSavePluginProps {
  onSave: () => Promise<void>;
  saveInterval: number;
}

export function AutoSavePlugin({ onSave, saveInterval }: AutoSavePluginProps) {
  const [editor] = useLexicalComposerContext();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isEditingRef = useRef(false);
  const pendingSaveRef = useRef(false);

  useEffect(() => {
    const unregister = editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
      if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
        isEditingRef.current = true;
        pendingSaveRef.current = true;
      }
    });

    return unregister;
  }, [editor]);

  useEffect(() => {
    // Setup autosave timer
    const saveCallback = async () => {
      // Only save if there are pending changes
      if (pendingSaveRef.current) {
        try {
          // Reset the pending flag before save attempt to avoid race conditions
          pendingSaveRef.current = false;
          await onSave();
        } catch (error) {
          // If save fails, mark as pending again
          pendingSaveRef.current = true;
          console.error('AutoSave failed:', error);
        }
      }
      
      // Reset editing state after save attempt
      isEditingRef.current = false;
    };

    // Start the interval timer
    timerRef.current = setInterval(saveCallback, saveInterval);

    // Check if user was editing when leaving the page
    const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      if (pendingSaveRef.current) {
        // Standard way of showing a confirmation dialog before page unload
        e.preventDefault();
        e.returnValue = '';
        
        // Try to save before unloading
        saveCallback();
        
        return '';
      }
    };

    window.addEventListener('beforeunload', beforeUnloadHandler);

    return () => {
      // Clean up
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      
      // Final save on unmount if there are pending changes
      if (pendingSaveRef.current) {
        saveCallback();
      }
    };
  }, [onSave, saveInterval]);

  // This plugin doesn't render anything
  return null;
} 