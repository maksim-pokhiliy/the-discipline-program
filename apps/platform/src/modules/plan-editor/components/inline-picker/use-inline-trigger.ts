"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { findCaretTrigger } from "@repo/ui";

export type InlineTriggerKind = "/" | "@";

export type InlineTriggerState = {
  kind: InlineTriggerKind;
  query: string;
  anchorEl: HTMLElement | null;
};

export type UseInlineTriggerOptions = {
  triggers: readonly InlineTriggerKind[];
  onTrigger?: (kind: InlineTriggerKind) => void;
};

export type UseInlineTriggerApi = {
  state: InlineTriggerState | null;
  inputProps: {
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur: () => void;
    inputRef: React.RefCallback<HTMLInputElement | HTMLTextAreaElement>;
  };
  close: () => void;
};

const isTriggerChar = (
  value: string,
  triggers: readonly InlineTriggerKind[],
): value is InlineTriggerKind => triggers.some((kind) => kind === value);

const findActiveTrigger = (
  text: string,
  caret: number,
  triggers: readonly InlineTriggerKind[],
): { kind: InlineTriggerKind; query: string } | null => {
  const result = findCaretTrigger(text, caret, triggers);

  if (!result || !isTriggerChar(result.kind, triggers)) {
    return null;
  }

  return { kind: result.kind, query: result.query };
};

export const useInlineTrigger = (options: UseInlineTriggerOptions): UseInlineTriggerApi => {
  const { triggers, onTrigger } = options;
  const triggersRef = useRef(triggers);

  triggersRef.current = triggers;

  const [state, setState] = useState<InlineTriggerState | null>(null);
  const elementRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const onTriggerRef = useRef(onTrigger);

  onTriggerRef.current = onTrigger;

  const close = useCallback(() => {
    setState(null);
  }, []);

  const refCallback = useCallback<React.RefCallback<HTMLInputElement | HTMLTextAreaElement>>(
    (node) => {
      elementRef.current = node;
    },
    [],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === "Escape") {
        if (state !== null) {
          event.preventDefault();
          setState(null);
        }

        return;
      }

      if (event.key.length !== 1) {
        return;
      }

      if (!isTriggerChar(event.key, triggersRef.current)) {
        return;
      }

      const target = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;

      window.requestAnimationFrame(() => {
        if (!elementRef.current || !target) {
          return;
        }

        setState({ kind: event.key as InlineTriggerKind, query: "", anchorEl: target });
        onTriggerRef.current?.(event.key as InlineTriggerKind);
      });
    },
    [state],
  );

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = event.currentTarget;
      const text = target.value;
      const caret = target.selectionStart ?? text.length;
      const active = findActiveTrigger(text, caret, triggersRef.current);

      if (!active) {
        setState(null);

        return;
      }

      setState({ kind: active.kind, query: active.query, anchorEl: target });
    },
    [],
  );

  const onBlur = useCallback(() => {
    window.setTimeout(() => {
      setState(null);
    }, 150);
  }, []);

  useEffect(
    () => () => {
      elementRef.current = null;
    },
    [],
  );

  return useMemo(
    () => ({
      state,
      close,
      inputProps: { onKeyDown, onChange, onBlur, inputRef: refCallback },
    }),
    [close, onBlur, onChange, onKeyDown, refCallback, state],
  );
};
