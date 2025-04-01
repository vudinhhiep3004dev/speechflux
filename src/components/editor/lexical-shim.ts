/**
 * This file provides compatibility shims for Lexical imports
 * It allows the codebase to work correctly with Lexical v0.29.0
 */

// Core Lexical components
export { LexicalComposer } from '@lexical/react/LexicalComposer';
export { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
export { ContentEditable } from '@lexical/react/LexicalContentEditable';
export { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
export { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
export { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
export { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
export { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

// Additional plugins
export { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
export { ListPlugin } from '@lexical/react/LexicalListPlugin';
export { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
export { TablePlugin } from '@lexical/react/LexicalTablePlugin';
export { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';

// Utilities
export { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
export { $isLinkNode, $createLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
export { $isListNode, $createListNode, $createListItemNode } from '@lexical/list';
export { $isHeadingNode, $createHeadingNode } from '@lexical/rich-text';

// Helper type definitions
import { LexicalNode } from 'lexical';

/**
 * Helper function to get the nearest node of a specific type
 * @param node The node to start searching from
 * @param type The constructor of the node type to search for
 * @returns The nearest node of the specified type, or null if not found
 */
export function $getNearestNodeOfType<T extends LexicalNode>(
  node: LexicalNode,
  type: {new(): T}
): T | null {
  let parent = node.getParent();
  while (parent && !(parent instanceof type)) {
    parent = parent.getParent();
  }
  return parent as T | null;
} 