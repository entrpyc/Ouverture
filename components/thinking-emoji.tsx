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
  const [emojis] = useState(pickThreeEmojis);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % emojis.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [emojis.length, intervalMs]);
  return <span aria-label="thinking">{emojis[index]}</span>;
}
