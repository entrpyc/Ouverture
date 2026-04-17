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

function pickEmoji(exclude: string[] = []) {
  const pool = THINKING_EMOJI_POOL.filter((e) => !exclude.includes(e));
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickThreeEmojis() {
  const picked: string[] = [];
  for (let i = 0; i < 3; i++) {
    picked.push(pickEmoji(picked));
  }
  return picked;
}

export function ThinkingEmoji({ intervalMs = 500 }: { intervalMs?: number }) {
  const [emojis, setEmojis] = useState(pickThreeEmojis);
  useEffect(() => {
    let position = 2;
    const id = setInterval(() => {
      setEmojis((prev) => {
        const next = [...prev];
        next[position] = pickEmoji(next);
        position = (position + 2) % 3;
        return next;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return <span aria-label="thinking">{emojis.join(" ")}</span>;
}
