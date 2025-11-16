/**
 * ============================================================================
 * MESSAGE INPUT COMPONENT
 * ============================================================================
 *
 * Composant d'envoi de messages avec support des fichiers, émojis et mentions
 */

import React, { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Send, Paperclip, Smile, X, File, Loader2 } from 'lucide-react';
import type { SendMessageData } from '../types/message.types';
import { toast } from 'sonner';
import { EmojiPicker } from './EmojiPicker';

// ============================================================================
// PROPS
// ============================================================================

export interface MessageInputProps {
  onSend: (data: SendMessageData) => Promise<void>;
  replyTo?: {
    messageId: string;
    content: string;
    senderName: string;
  };
  onCancelReply?: () => void;
  conversationId: string;
  currentUserId: string;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  disabled?: boolean;
}

// ============================================================================
// TYPES
// ============================================================================

interface FilePreview {
  file: File;
  preview?: string;
  type: 'image' | 'file';
}

// ============================================================================
// UTILS
// ============================================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

const isImageFile = (type: string): boolean => {
  return type.startsWith('image/');
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const extractMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }

  return mentions;
};

// Note: POPULAR_EMOJIS supprimé - utilise maintenant emoji-picker-react

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  replyTo,
  onCancelReply,
  onTypingStart,
  onTypingStop,
  disabled = false,
}) => {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const [pickerPosition, setPickerPosition] = useState({ bottom: 80, left: 16 });

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [content]);

  // Gérer l'indicateur de frappe
  useEffect(() => {
    if (content && !isTyping) {
      setIsTyping(true);
      onTypingStart?.();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTypingStop?.();
      }
    }, 2000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [content]);

  // Cleanup typing on unmount
  useEffect(() => {
    return () => {
      if (isTyping) {
        onTypingStop?.();
      }
    };
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FilePreview[] = [];
    const errors: string[] = [];

    Array.from(selectedFiles).forEach(file => {
      // Vérifier la taille
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Taille maximale 10MB`);
        return;
      }

      // Vérifier le type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Type de fichier non supporté`);
        return;
      }

      // Créer preview pour les images
      const filePreview: FilePreview = {
        file,
        type: isImageFile(file.type) ? 'image' : 'file',
      };

      if (isImageFile(file.type)) {
        const reader = new FileReader();
        reader.onload = e => {
          filePreview.preview = e.target?.result as string;
          setFiles(prev => [...prev]);
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(filePreview);
    });

    if (errors.length > 0) {
      toast.error(errors.join('\n'));
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.slice(0, start) + emoji + content.slice(end);

    setContent(newContent);
    setShowEmojiPicker(false);

    // Repositionner le curseur
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + emoji.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if ((!content.trim() && files.length === 0) || isSending || disabled) {
      return;
    }

    setIsSending(true);

    try {
      const mentions = extractMentions(content);

      await onSend({
        content: content.trim(),
        attachments: files.map(f => f.file),
        mentions: mentions.length > 0 ? mentions : undefined,
        replyTo,
      });

      // Reset
      setContent('');
      setFiles([]);
      onCancelReply?.();

      // Stop typing
      if (isTyping) {
        setIsTyping(false);
        onTypingStop?.();
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setIsSending(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="border-t bg-background p-4 space-y-3 relative">
      {/* Répondre à */}
      {replyTo && (
        <div className="flex items-start gap-2 p-2 bg-accent/50 rounded-lg border-l-2 border-primary">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary">Réponse à {replyTo.senderName}</p>
            <p className="text-sm text-muted-foreground truncate">{replyTo.content}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onCancelReply} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Previews des fichiers */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((filePreview, index) => (
            <div key={index} className="relative group rounded-lg border bg-card overflow-hidden">
              {filePreview.type === 'image' && filePreview.preview ? (
                <div className="relative w-20 h-20">
                  <img
                    src={filePreview.preview}
                    alt={filePreview.file.name}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveFile(index)}
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 pr-8">
                  <File className="h-8 w-8 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate max-w-[100px]">
                      {filePreview.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(filePreview.file.size)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveFile(index)}
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <>
          {/* Overlay pour fermer au clic à l'extérieur */}
          <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
          <div
            className="fixed z-50"
            style={{
              bottom: `${pickerPosition.bottom}px`,
              left: `${pickerPosition.left}px`,
            }}
          >
            <EmojiPicker onEmojiClick={handleEmojiSelect} width={350} height={400} />
          </div>
        </>
      )}

      {/* Input principal */}
      <div className="flex items-end gap-2">
        {/* Boutons latéraux */}
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_FILE_TYPES.join(',')}
            onChange={e => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="h-9 w-9 p-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Button
            ref={emojiButtonRef}
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              if (!showEmojiPicker && emojiButtonRef.current) {
                const rect = emojiButtonRef.current.getBoundingClientRect();
                setPickerPosition({
                  bottom: window.innerHeight - rect.top + 8,
                  left: rect.left,
                });
              }
              setShowEmojiPicker(!showEmojiPicker);
            }}
            disabled={disabled}
            className="h-9 w-9 p-0"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </div>

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          placeholder="Écrivez votre message... (@mention pour mentionner)"
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSending}
          rows={1}
          className="min-h-[40px] max-h-[200px] resize-none"
        />

        {/* Bouton envoyer */}
        <Button
          onClick={handleSubmit}
          disabled={disabled || isSending || (!content.trim() && files.length === 0)}
          size="sm"
          className="h-9 w-9 p-0"
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      {/* Aide */}
      <p className="text-xs text-muted-foreground">
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> pour envoyer,{' '}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Shift+Enter</kbd> pour nouvelle
        ligne
      </p>
    </div>
  );
};
