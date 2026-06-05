"use client";

import {
  Bold,
  Code,
  ExternalLink,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  UnderlineIcon,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import { Table as TableExtension } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Underline from "@tiptap/extension-underline";

import { MediaPickerField, type PortalMediaOption } from "@/components/portal/MediaPickerField";

export function RichTextField({
  defaultValue = "",
  media = [],
  name,
  onChange,
}: {
  defaultValue?: string;
  media?: PortalMediaOption[];
  name: string;
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false, underline: false }),
      Underline,
      LinkExtension.configure({ openOnClick: false }),
      ImageExtension.configure({ inline: false }),
      TableExtension.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class: "article-editor__canvas",
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor: activeEditor }) => {
      const html = activeEditor.getHTML();
      setValue(html);
      onChange?.(html);
    },
  });

  const editorText = editor?.getText() ?? "";
  const wordCount = editorText.trim() ? editorText.trim().split(/\s+/).length : 0;

  function setLink(external = false) {
    const href = window.prompt(external ? "Paste external URL" : "Paste internal path, for example /safari-packages");
    if (!href) return;
    editor?.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }

  function insertImage(item: PortalMediaOption) {
    const src = item.url || item.thumbUrl;
    if (!src) return;
    editor?.chain().focus().setImage({ src, alt: item.alt || item.filename }).run();
    setMediaDialogOpen(false);
  }

  return (
    <div className="article-editor">
      <input name={name} type="hidden" value={value} />
      <div className="article-editor__toolbar">
        <button onClick={() => editor?.chain().focus().undo().run()} type="button"><Undo2 size={17} /></button>
        <button onClick={() => editor?.chain().focus().redo().run()} type="button"><Redo2 size={17} /></button>
        <span />
        <button onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} type="button"><Heading1 size={17} /></button>
        <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} type="button"><Heading2 size={17} /></button>
        <button onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} type="button"><Heading3 size={17} /></button>
        <button onClick={() => editor?.chain().focus().toggleBold().run()} type="button"><Bold size={17} /></button>
        <button onClick={() => editor?.chain().focus().toggleItalic().run()} type="button"><Italic size={17} /></button>
        <button onClick={() => editor?.chain().focus().toggleUnderline().run()} type="button"><UnderlineIcon size={17} /></button>
        <button onClick={() => editor?.chain().focus().toggleStrike().run()} type="button"><Strikethrough size={17} /></button>
        <button onClick={() => editor?.chain().focus().toggleCode().run()} type="button"><Code size={17} /></button>
        <button onClick={() => editor?.chain().focus().toggleBulletList().run()} type="button"><List size={17} /></button>
        <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} type="button"><ListOrdered size={17} /></button>
        <button onClick={() => editor?.chain().focus().toggleBlockquote().run()} type="button"><Quote size={17} /></button>
        <button onClick={() => editor?.chain().focus().setHorizontalRule().run()} type="button"><Pilcrow size={17} /></button>
        <button onClick={() => setLink(false)} type="button"><LinkIcon size={17} /></button>
        <button onClick={() => setLink(true)} type="button"><ExternalLink size={17} /></button>
        <button onClick={() => setMediaDialogOpen(true)} title="Insert image from gallery" type="button"><ImagePlus size={17} /></button>
        <button onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} type="button"><TableIcon size={17} /></button>
        <strong>{wordCount} words</strong>
      </div>
      <div className="article-editor__content">
        <EditorContent editor={editor} />
      </div>
      {mediaDialogOpen ? (
        <MediaPickerField
          autoOpen
          label="Insert image into article"
          onChange={(_, selected) => {
            const item = selected[0];
            if (item) insertImage(item);
          }}
          onClose={() => setMediaDialogOpen(false)}
          options={media}
        />
      ) : null}
    </div>
  );
}
