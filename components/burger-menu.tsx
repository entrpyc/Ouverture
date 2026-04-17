"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export function BurgerMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  function handleProfile() {
    setOpen(false);
    router.push("/profile");
  }

  function handleSignOut() {
    setOpen(false);
    void signOut({ callbackUrl: "/login" });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleProfile}
            className="block w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none"
          >
            Profile
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="block w-full border-t border-zinc-800 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
