"use client";

import { useState } from "react";

function legacyCopy(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok;
}

export function SpecActions({ spec }: { spec: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function handleCopy() {
    setCopyError(false);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(spec);
      } else if (!legacyCopy(spec)) {
        throw new Error("copy unavailable");
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (legacyCopy(spec)) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setCopyError(true);
        setTimeout(() => setCopyError(false), 2000);
      }
    }
  }

  function handleDownload() {
    const blob = new Blob([spec], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "SPEC.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const buttonClass =
    "rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-600";

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={handleCopy} className={buttonClass}>
        {copyError ? "Copy failed" : copied ? "Copied" : "Copy"}
      </button>
      <button type="button" onClick={handleDownload} className={buttonClass}>
        Download
      </button>
    </div>
  );
}
