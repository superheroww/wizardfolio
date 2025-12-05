import { useCallback, useEffect, useState } from "react";

type UseClipboardOptions = {
  resetAfter?: number;
};

export function useClipboard(options: UseClipboardOptions = {}) {
  const { resetAfter = 1500 } = options;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timeout = window.setTimeout(() => setCopied(false), resetAfter);
    return () => window.clearTimeout(timeout);
  }, [copied, resetAfter]);

  const copy = useCallback(async (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
      return true;
    } catch (error) {
      console.error("Failed to copy text", error);
      setCopied(false);
      return false;
    }
  }, []);

  return { copy, copied };
}
