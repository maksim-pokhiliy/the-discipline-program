"use client";

import { useEffect, useRef } from "react";

import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEditor as useTiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const UPDATE_THROTTLE_MS = 150;

type UseEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  disabled: boolean;
};

export const useEditor = ({ value, onChange, onBlur, placeholder, disabled }: UseEditorProps) => {
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  const pendingValueRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onBlurRef.current = onBlur;
  }, [onBlur]);

  const flushPendingUpdate = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (pendingValueRef.current !== null) {
      const next = pendingValueRef.current;

      pendingValueRef.current = null;
      onChangeRef.current(next);
    }
  };

  const editor = useTiptapEditor({
    immediatelyRender: false,
    onBlur: () => {
      flushPendingUpdate();
      onBlurRef.current?.();
    },
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
      pendingValueRef.current = editor.getHTML();

      if (timerRef.current !== null) {
        return;
      }

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const next = pendingValueRef.current;

        pendingValueRef.current = null;

        if (next !== null) {
          onChangeRef.current(next);
        }
      }, UPDATE_THROTTLE_MS);
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return editor;
};
