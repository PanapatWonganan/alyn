"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Heading2,
  Heading3,
  Pilcrow,
} from "lucide-react";

interface RichTextEditorProps {
  content?: string;
  onChange?: (html: string, text: string) => void;
  placeholder?: string;
  editable?: boolean;
}

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded-lg p-2 transition-colors ${
        active
          ? "bg-rosegold-dark text-white"
          : "text-brand-black/60 hover:bg-cream hover:text-rosegold-dark"
      }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({
  content = "",
  onChange,
  placeholder = "เริ่มเขียนเรื่องราวของคุณ...",
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      const text = e.getText();
      onChange?.(html, text);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none min-h-[400px] px-6 py-4 focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  const charCount = editor.storage.characterCount?.characters() ?? 0;
  const wordCount = editor.storage.characterCount?.words() ?? 0;

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-white">
      {/* Toolbar */}
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-cream/30 px-2 py-1.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            active={editor.isActive("paragraph")}
            title="ย่อหน้า"
          >
            <Pilcrow className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="หัวข้อใหญ่"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="หัวข้อเล็ก"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>

          <div className="mx-1 h-6 w-px bg-border" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="ตัวหนา"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="ตัวเอียง"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="ขีดฆ่า"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>

          <div className="mx-1 h-6 w-px bg-border" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="รายการ"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="รายการลำดับ"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="อ้างอิง"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="เส้นคั่น"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>

          <div className="mx-1 h-6 w-px bg-border" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="ย้อนกลับ"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="ทำซ้ำ"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>

          {/* Word count */}
          <div className="ml-auto text-xs text-muted-foreground">
            {charCount.toLocaleString()} ตัวอักษร | {wordCount.toLocaleString()} คำ
          </div>
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
