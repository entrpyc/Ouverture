"use client";

import { useEffect, useState } from "react";

const THINKING_EMOJI_POOL = [
  "🤔",
  "💭",
  "💡",
  "😤",
  "🤬",
  "💀",
  "🤨",
  "😵‍💫",
  "🥴",
  "🧐",
  "🤓",
  "🤖",
  "🧑‍🍳",
  "🤡",
  "🐌",
];

function pickThreeEmojis() {
  const pool = [...THINKING_EMOJI_POOL];
  const picked: string[] = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

export function ThinkingEmoji({ intervalMs = 3000 }: { intervalMs?: number }) {
  const [emojis, setEmojis] = useState(pickThreeEmojis);
  useEffect(() => {
    const id = setInterval(() => {
      setEmojis(pickThreeEmojis());
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return <span aria-label="thinking">{emojis.join(" ")}</span>;
}
