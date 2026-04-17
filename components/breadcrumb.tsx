"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type BreadcrumbSibling = {
  id: string;
  title: string;
  href: string;
};

export type BreadcrumbSegment = {
  label: string;
  href: string | null;
  siblings?: BreadcrumbSibling[];
  currentId?: string;
};

const HOVER_DELAY_MS = 500;

function Separator() {
  return (
    <span aria-hidden="true" className="px-1 text-zinc-600">
      /
    </span>
  );
}

function SegmentWithDropdown({ segment }: { segment: BreadcrumbSegment }) {
  const [open, setOpen] = useState(false);
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    };
  }, []);

  const siblings = segment.siblings ?? [];
  const hasDropdown = siblings.length > 0;

  function handleEnter() {
    if (!hasDropdown) return;
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    openTimeoutRef.current = setTimeout(() => setOpen(true), HOVER_DELAY_MS);
  }

  function handleLeave() {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    setOpen(false);
  }

  const labelEl = segment.href ? (
    <Link
      href={segment.href}
      className="max-w-[20ch] truncate rounded px-1 text-zinc-300 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600"
    >
      {segment.label}
    </Link>
  ) : (
    <span
      aria-current="page"
      className="max-w-[20ch] truncate rounded px-1 text-zinc-100"
    >
      {segment.label}
    </span>
  );

  return (
    <div
      ref={wrapperRef}
      className="relative flex items-center"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {labelEl}
      {open && hasDropdown && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 max-h-80 w-56 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-900 py-1 shadow-lg"
        >
          {siblings.map((sibling) => {
            const isCurrent = sibling.id === segment.currentId;
            return (
              <Link
                key={sibling.id}
                href={sibling.href}
                role="menuitem"
                aria-current={isCurrent ? "page" : undefined}
                className={
                  "block truncate px-3 py-1.5 text-sm " +
                  (isCurrent
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100")
                }
              >
                {sibling.title}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Breadcrumb({ segments }: { segments: BreadcrumbSegment[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center">
      <ol className="flex min-w-0 items-center text-sm">
        {segments.map((segment, i) => (
          <li key={i} className="flex items-center">
            {i > 0 && <Separator />}
            <SegmentWithDropdown segment={segment} />
          </li>
        ))}
      </ol>
    </nav>
  );
}
