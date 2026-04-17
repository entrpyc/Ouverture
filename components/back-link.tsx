"use client";

import { useRouter } from "next/navigation";

type Props = {
  href?: string;
  label: string;
  disabled?: boolean;
};

function ChevronIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 3L5 8l5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BackLink({ href, label, disabled = false }: Props) {
  const router = useRouter();

  if (disabled || !href) {
    return (
      <span
        aria-label={label}
        aria-disabled="true"
        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-700"
      >
        <ChevronIcon />
      </span>
    );
  }

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }
    e.preventDefault();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(href as string);
    }
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600"
    >
      <ChevronIcon />
    </a>
  );
}
