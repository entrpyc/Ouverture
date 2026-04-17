"use client";

type Props = {
  onClick: () => void;
  label?: string;
};

export function NewProjectButton({ onClick, label = "New project" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-400"
    >
      <span aria-hidden="true">+</span>
      {label}
    </button>
  );
}
