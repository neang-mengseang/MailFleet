import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { useCallback, useRef, useState } from 'react';
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Link as LinkIcon, Image as ImageIcon,
  Undo, Redo, AlignLeft, AlignCenter, AlignRight, Paperclip, Loader2,
} from 'lucide-react';
import { api } from '../api';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 600;
const IMAGE_QUALITY = 0.85;
const MAX_COMPRESSED_SIZE = 300 * 1024;

export interface Attachment {
  filename: string;
  content: string;
  contentType: string;
}

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  onAttachmentsChange?: (attachments: Attachment[]) => void;
}

export default function RichEditor({ value, onChange, onAttachmentsChange }: RichEditorProps) {
  const attachmentsRef = useRef<Attachment[]>([]);
  const [, forceRender] = useState(0);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Write your email here...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        style: 'min-height: 300px; padding: 16px; outline: none; color: var(--text); font-size: 14px; line-height: 1.6;',
      },
    },
  });

  const addAttachment = useCallback((att: Attachment) => {
    attachmentsRef.current = [...attachmentsRef.current, att];
    onAttachmentsChange?.(attachmentsRef.current);
    forceRender(v => v + 1);
  }, [onAttachmentsChange]);

  const removeAttachment = useCallback((filename: string) => {
    attachmentsRef.current = attachmentsRef.current.filter(a => a.filename !== filename);
    onAttachmentsChange?.(attachmentsRef.current);
    forceRender(v => v + 1);
  }, [onAttachmentsChange]);

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > MAX_FILE_SIZE) {
        alert(`Image too large. Max upload is 5MB. This file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`);
        return;
      }
      setUploading(true);
      try {
        const dataUrl = await compressImage(file, MAX_IMAGE_WIDTH, IMAGE_QUALITY, MAX_COMPRESSED_SIZE);
        const base64 = dataUrl.split(',')[1];

        let imageUrl = dataUrl;
        try {
          const result = await api.uploadToStorage(base64, file.name, 'image/jpeg');
          imageUrl = result.url;
        } catch {
          // No storage configured or upload failed — fall back to inline base64
        }

        if (editor) {
          editor.chain().focus()
            .setImage({
              src: imageUrl,
              alt: file.name,
              title: file.name,
            })
            .run();
        }
      } catch (err: any) {
        alert(`Failed to process image: ${err.message}`);
      }
      setUploading(false);
    };
    input.click();
  }, [editor]);

  const handleDocumentUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.csv';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > MAX_FILE_SIZE) {
        alert(`File too large. Max size is 2MB. This file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        addAttachment({
          filename: file.name,
          content: base64,
          contentType: file.type || 'application/octet-stream',
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [addAttachment]);

  const setLink = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return <div>Loading editor...</div>;

  const ToolbarButton = ({ onClick, active, icon: Icon, title }: {
    onClick: () => void; active?: boolean; icon: typeof Bold; title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`toolbar-btn ${active ? 'active' : ''}`}
      title={title}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div className="rich-editor">
      <div className="toolbar">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} icon={Bold} title="Bold" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} icon={Italic} title="Italic" />
        <span className="toolbar-divider" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} icon={Heading1} title="Heading 1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} icon={Heading2} title="Heading 2" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} icon={Heading3} title="Heading 3" />
        <span className="toolbar-divider" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} icon={List} title="Bullet List" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} icon={ListOrdered} title="Numbered List" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} icon={Quote} title="Quote" />
        <span className="toolbar-divider" />
        <ToolbarButton onClick={setLink} active={editor.isActive('link')} icon={LinkIcon} title="Insert Link" />
        <ToolbarButton
          onClick={handleImageUpload}
          icon={uploading ? Loader2 : ImageIcon}
          title={uploading ? 'Uploading...' : 'Insert Image (auto-compressed to 800px, max 5MB upload)'}
        />
        {uploading && <span style={{ fontSize: 12, color: 'var(--text-dim)', alignSelf: 'center' }}>Uploading...</span>}
        <span className="toolbar-divider" />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} icon={AlignLeft} title="Align Left" />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} icon={AlignCenter} title="Align Center" />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} icon={AlignRight} title="Align Right" />
        <span className="toolbar-divider" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} icon={Undo} title="Undo" />
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} icon={Redo} title="Redo" />
      </div>

      <div className="editor-content-wrapper">
        <EditorContent editor={editor} />
      </div>

      <div className="attachment-bar">
        <button type="button" className="btn" onClick={handleDocumentUpload}>
          <Paperclip size={14} /> Attach Document
        </button>
        {attachmentsRef.current.length > 0 && (
          <div className="attachment-list">
            {attachmentsRef.current.map(a => (
              <div key={a.filename} className="attachment-chip">
                <span>{a.filename}</span>
                <button type="button" onClick={() => removeAttachment(a.filename)}>&times;</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function compressImage(
  file: File,
  maxWidth: number,
  quality: number,
  maxSize: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        let currentQuality = quality;
        let dataUrl = canvas.toDataURL('image/jpeg', currentQuality);

        while (dataUrl.length > maxSize * 1.37 && currentQuality > 0.3) {
          currentQuality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
        }

        if (dataUrl.length > maxSize * 1.37) {
          const scale = 0.7;
          canvas.width = Math.round(width * scale);
          canvas.height = Math.round(height * scale);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
