"use client";

import { useEffect } from "react";

import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEditor as useTiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type UseEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  disabled: boolean;
};

export const useEditor = ({ value, onChange, onBlur, placeholder, disabled }: UseEditorProps) => {
  const editor = useTiptapEditor({
    immediatelyRender: false,
    onBlur: () => onBlur?.(),
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  return editor;
};
