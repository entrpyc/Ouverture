"use client";

export function NewTaskButton() {
  return (
    <button
      type="button"
      onClick={() => console.log("new task")}
      className="inline-flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
    >
      <span aria-hidden="true">+</span>
      New task
    </button>
  );
}
