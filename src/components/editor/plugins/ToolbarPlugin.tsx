'use client';

import { useCallback, useEffect, useState } from 'react';
import { 
  useLexicalComposerContext,
  $getNearestNodeOfType 
} from '../lexical-shim';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  $createParagraphNode,
  $getNodeByKey,
  LexicalEditor,
  LexicalNode,
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
  $isParentElementRTL,
  $patchStyleText,
  $setBlocksType,
} from '@lexical/selection';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from '@lexical/list';
import { createPortal } from 'react-dom';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Quote,
  Undo,
  Redo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');
  const [linkUrl, setLinkUrl] = useState('');
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Format text
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));

      // Check link
      const node = selection.anchor.getNode();
      const parent = node.getParent();
      setIsLink($isLinkNode(parent) || $isLinkNode(node));

      // Get block type
      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === 'root'
        ? anchorNode
        : anchorNode.getTopLevelElementOrThrow();
      
      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);

      // Update block type
      if (elementDOM) {
        if ($isHeadingNode(element)) {
          const tag = element.getTag();
          setBlockType(tag);
        } else if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const listType = parentList ? parentList.getListType() : element.getListType();
          setBlockType(listType === 'bullet' ? 'ul' : 'ol');
        } else {
          setBlockType('paragraph');
        }
      }
    }
  }, [activeEditor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          $updateToolbar();
          setActiveEditor(newEditor);
          return false;
        },
        0
      )
    );
  }, [editor, $updateToolbar]);

  const formatHeading = useCallback(
    (headingLevel: string) => {
      if (blockType !== headingLevel) {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode(headingLevel));
          }
        });
      }
    },
    [blockType, editor]
  );

  const formatParagraph = useCallback(() => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode());
        }
      });
    }
  }, [blockType, editor]);

  const formatList = useCallback(
    (listType: string) => {
      if (listType === 'ul') {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      } else if (listType === 'ol') {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      } else {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      }
    },
    [editor]
  );

  const handleLinkSubmit = useCallback(() => {
    if (linkUrl.trim() !== '') {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
    setIsLinkDialogOpen(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  // Helper functions
  function $createHeadingNode(headingTag: string) {
    if ($isHeadingNode) {
      const HeadingNode = $isHeadingNode(null).constructor;
      return new (HeadingNode as any)(headingTag);
    }
    return $createParagraphNode();
  }

  return (
    <div className="toolbar sticky top-0 z-10 flex flex-wrap items-center gap-1 bg-white p-2 border-b">
      <TooltipProvider>
        <div className="flex items-center space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn({ 'bg-muted': isBold })}
                onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
              >
                <Bold className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn({ 'bg-muted': isItalic })}
                onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
              >
                <Italic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn({ 'bg-muted': isUnderline })}
                onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
              >
                <Underline className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Underline</TooltipContent>
          </Tooltip>
        </div>
        
        <div className="mx-1 h-6 w-px bg-muted" />
        
        <div className="flex items-center space-x-1">
          <Select
            value={blockType}
            onValueChange={(value) => {
              if (value === 'paragraph') {
                formatParagraph();
              } else if (['h1', 'h2', 'h3'].includes(value)) {
                formatHeading(value);
              } else if (['ul', 'ol'].includes(value)) {
                formatList(value);
              }
            }}
          >
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paragraph">Paragraph</SelectItem>
              <SelectItem value="h1">Heading 1</SelectItem>
              <SelectItem value="h2">Heading 2</SelectItem>
              <SelectItem value="h3">Heading 3</SelectItem>
              <SelectItem value="ul">Bullet List</SelectItem>
              <SelectItem value="ol">Numbered List</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="mx-1 h-6 w-px bg-muted" />
        
        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn({ 'bg-muted': isLink })}
                  onClick={() => {
                    // If there's already a link, pre-fill the URL
                    if (isLink) {
                      editor.update(() => {
                        const selection = $getSelection();
                        if ($isRangeSelection(selection)) {
                          const node = selection.anchor.getNode();
                          const parent = node.getParent();
                          const linkNode = $isLinkNode(parent) ? parent : ($isLinkNode(node) ? node : null);
                          if (linkNode) {
                            setLinkUrl(linkNode.getURL());
                          }
                        }
                      });
                    }
                  }}
                >
                  <Link className="h-4 w-4" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>Add Link</TooltipContent>
          </Tooltip>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Insert Link</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              {isLink && (
                <Button
                  variant="outline"
                  onClick={() => {
                    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
                    setIsLinkDialogOpen(false);
                  }}
                >
                  Remove Link
                </Button>
              )}
              <Button onClick={handleLinkSubmit}>
                {isLink ? 'Update' : 'Insert'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </div>
  );
} 